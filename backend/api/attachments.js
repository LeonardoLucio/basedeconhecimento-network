const fs = require('fs')
const path = require('path')
const { randomUUID } = require('crypto')
const multer = require('multer')
const WordExtractor = require('word-extractor')
const { PDFParse } = require('pdf-parse')
const yauzl = require('yauzl')
const { SaxesParser } = require('saxes')

const storageDirectory = path.resolve(__dirname, '../uploads')
const maximumFileSize = 20 * 1024 * 1024
const maximumExtractedCharacters = 1_000_000
const maximumDocxExpandedSize = 50 * 1024 * 1024
const maximumExtractedImageBytes = 10 * 1024 * 1024
const allowedExtensions = new Set(['.pdf', '.doc', '.docx'])
const mimeTypes = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maximumFileSize, files: 1 },
    fileFilter(req, file, callback) {
        const extension = path.extname(file.originalname).toLowerCase()
        if (!allowedExtensions.has(extension)) {
            const error = new Error('Formato não suportado. Envie um arquivo PDF, DOC ou DOCX.')
            error.status = 415
            return callback(error)
        }
        callback(null, true)
    }
})

const cleanText = text => text
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()

const getImageExtension = buffer => {
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
        return 'png'
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'jpg'
    if (buffer.subarray(0, 3).toString() === 'GIF') return 'gif'
    if (buffer.subarray(0, 4).toString() === 'RIFF' &&
        buffer.subarray(8, 12).toString() === 'WEBP') return 'webp'
    return null
}

const readAttribute = (attributes, localName) =>
    Object.values(attributes).find(attribute => attribute.local === localName)?.value

const formatListNumber = (value, format) => {
    if (format === 'decimalZero') return String(value).padStart(2, '0')
    if (format === 'upperRoman' || format === 'lowerRoman') {
        const numerals = [
            [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'],
            [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'],
            [5, 'V'], [4, 'IV'], [1, 'I']
        ]
        let remainder = value
        let result = ''
        for (const [amount, numeral] of numerals) {
            while (remainder >= amount) {
                result += numeral
                remainder -= amount
            }
        }
        return format === 'lowerRoman' ? result.toLowerCase() : result
    }
    if (format === 'upperLetter' || format === 'lowerLetter') {
        let remainder = value
        let result = ''
        while (remainder > 0) {
            remainder--
            result = String.fromCharCode(65 + (remainder % 26)) + result
            remainder = Math.floor(remainder / 26)
        }
        return format === 'lowerLetter' ? result.toLowerCase() : result
    }
    return String(value)
}

const parseDocxContent = (documentXml, relationshipsXml, numberingXml, media) => {
    const relationships = new Map()
    const relationshipParser = new SaxesParser({ xmlns: true })
    relationshipParser.on('opentag', tag => {
        if (tag.local !== 'Relationship') return
        relationships.set(
            readAttribute(tag.attributes, 'Id'),
            readAttribute(tag.attributes, 'Target')
        )
    })
    relationshipParser.write(relationshipsXml || '<Relationships/>').close()

    const abstractNumbering = new Map()
    const numberingInstances = new Map()
    let abstractId = null
    let numberingId = null
    let abstractLevel = null
    let overrideLevel = null
    if (numberingXml) {
        const numberingParser = new SaxesParser({ xmlns: true })
        numberingParser.on('opentag', tag => {
            if (tag.local === 'abstractNum') {
                abstractId = readAttribute(tag.attributes, 'abstractNumId')
                abstractNumbering.set(abstractId, new Map())
            }
            if (tag.local === 'num') {
                numberingId = readAttribute(tag.attributes, 'numId')
                numberingInstances.set(numberingId, { levels: new Map() })
            }
            if (tag.local === 'abstractNumId' && numberingId) {
                numberingInstances.get(numberingId).abstractId = readAttribute(tag.attributes, 'val')
            }
            if (tag.local === 'lvl' && abstractId) {
                abstractLevel = Number(readAttribute(tag.attributes, 'ilvl') || 0)
                abstractNumbering.get(abstractId).set(abstractLevel, { start: 1 })
            } else if (tag.local === 'lvl' && numberingId && overrideLevel !== null) {
                const override = numberingInstances.get(numberingId).levels.get(overrideLevel)
                override.level = Number(readAttribute(tag.attributes, 'ilvl') || overrideLevel)
            }
            if (tag.local === 'lvlOverride' && numberingId) {
                overrideLevel = Number(readAttribute(tag.attributes, 'ilvl') || 0)
                numberingInstances.get(numberingId).levels.set(overrideLevel, {})
            }
            if (tag.local === 'startOverride' && numberingId && overrideLevel !== null) {
                numberingInstances.get(numberingId).levels.get(overrideLevel).start =
                    Number(readAttribute(tag.attributes, 'val')) || 1
            }
            if (tag.local === 'start' && abstractId && abstractLevel !== null) {
                abstractNumbering.get(abstractId).get(abstractLevel).start =
                    Number(readAttribute(tag.attributes, 'val')) || 1
            } else if (tag.local === 'start' && numberingId && overrideLevel !== null) {
                numberingInstances.get(numberingId).levels.get(overrideLevel).start =
                    Number(readAttribute(tag.attributes, 'val')) || 1
            }
            if (tag.local === 'numFmt') {
                const format = readAttribute(tag.attributes, 'val')
                if (abstractId && abstractLevel !== null) {
                    abstractNumbering.get(abstractId).get(abstractLevel).format = format
                } else if (numberingId && overrideLevel !== null) {
                    numberingInstances.get(numberingId).levels.get(overrideLevel).format = format
                }
            }
            if (tag.local === 'lvlText') {
                const value = readAttribute(tag.attributes, 'val')
                if (abstractId && abstractLevel !== null) {
                    abstractNumbering.get(abstractId).get(abstractLevel).text = value
                } else if (numberingId && overrideLevel !== null) {
                    numberingInstances.get(numberingId).levels.get(overrideLevel).text = value
                }
            }
        })
        numberingParser.on('closetag', tag => {
            if (tag.local === 'lvl' && abstractId) abstractLevel = null
            if (tag.local === 'lvlOverride') overrideLevel = null
            if (tag.local === 'abstractNum') abstractId = null
            if (tag.local === 'num') numberingId = null
        })
        numberingParser.write(numberingXml).close()
    }

    const paragraphs = []
    const imageRelationshipIds = []
    const parser = new SaxesParser({ xmlns: true })
    let currentParagraph = null
    let readingText = false
    let paragraphStyle = ''
    let numberedParagraph = false
    let paragraphNumberId = null
    let paragraphNumberLevel = 0
    let bold = false
    let italic = false
    let underline = false
    let fontSize = null
    parser.on('opentag', tag => {
        if (tag.local === 'p') {
            currentParagraph = ''
            paragraphStyle = ''
            numberedParagraph = false
            paragraphNumberId = null
            paragraphNumberLevel = 0
        } else if (currentParagraph !== null && tag.local === 'pStyle') {
            paragraphStyle = readAttribute(tag.attributes, 'val') || ''
        } else if (currentParagraph !== null && tag.local === 'numId') {
            paragraphNumberId = readAttribute(tag.attributes, 'val')
            numberedParagraph = paragraphNumberId !== '0'
        } else if (currentParagraph !== null && tag.local === 'ilvl') {
            paragraphNumberLevel = Number(readAttribute(tag.attributes, 'val')) || 0
        } else if (currentParagraph !== null && tag.local === 'b') {
            bold = readAttribute(tag.attributes, 'val') !== '0' && readAttribute(tag.attributes, 'val') !== 'false'
        } else if (currentParagraph !== null && tag.local === 'i') {
            italic = readAttribute(tag.attributes, 'val') !== '0' && readAttribute(tag.attributes, 'val') !== 'false'
        } else if (currentParagraph !== null && tag.local === 'u') {
            underline = readAttribute(tag.attributes, 'val') !== 'none' && readAttribute(tag.attributes, 'val') !== '0'
        } else if (currentParagraph !== null && tag.local === 'sz') {
            const halfPoints = Number(readAttribute(tag.attributes, 'val'))
            if (halfPoints > 0) fontSize = `${halfPoints / 2}pt`
        } else if (currentParagraph !== null && tag.local === 't') {
            readingText = true
        } else if (currentParagraph !== null && tag.local === 'tab') {
            currentParagraph += '&nbsp;&nbsp;&nbsp;'
        } else if (currentParagraph !== null && ['br', 'cr'].includes(tag.local)) {
            currentParagraph += '<br>'
        } else if (tag.local === 'blip') {
            const relationshipId = readAttribute(tag.attributes, 'embed')
            if (relationshipId) {
                const marker = `@@IMAGE_${imageRelationshipIds.length}@@`
                imageRelationshipIds.push(relationshipId)
                if (currentParagraph !== null) currentParagraph += marker
                else paragraphs.push({ html: marker, style: '', numbered: false, listType: null })
            }
        }
    })
    parser.on('text', text => {
        if (readingText && currentParagraph !== null) {
            let value = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            if (underline) value = `<u>${value}</u>`
            if (italic) value = `<em>${value}</em>`
            if (bold) value = `<strong>${value}</strong>`
            if (fontSize) value = `<span style="font-size:${fontSize}">${value}</span>`
            currentParagraph += value
        }
    })
    parser.on('closetag', tag => {
        if (tag.local === 't') readingText = false
        if (tag.local === 'p' && currentParagraph !== null) {
            const numbering = numberingInstances.get(paragraphNumberId)
            const abstractLevels = abstractNumbering.get(numbering?.abstractId)
            const level = {
                ...(abstractLevels?.get(paragraphNumberLevel) || {}),
                ...(numbering?.levels.get(paragraphNumberLevel) || {})
            }
            paragraphs.push({
                html: currentParagraph,
                style: paragraphStyle,
                numbered: numberedParagraph,
                numberingId: paragraphNumberId,
                numberingLevel: paragraphNumberLevel,
                numberingFormat: level.format || 'decimal',
                numberingText: level.text || `%${paragraphNumberLevel + 1}.`,
                numberingStart: level.start || 1,
                listType: level.format === 'bullet' ? 'ul' : 'ol'
            })
            currentParagraph = null
        } else if (tag.local === 'r') {
            bold = false
            italic = false
            underline = false
            fontSize = null
        }
    })
    parser.write(documentXml).close()

    const images = []
    const imageIndexes = new Map()
    for (const [markerIndex, relationshipId] of imageRelationshipIds.entries()) {
        const target = relationships.get(relationshipId)
        if (!target) continue
        const mediaPath = target.startsWith('/')
            ? target.slice(1)
            : path.posix.normalize(path.posix.join('word', target))
        if (!mediaPath.startsWith('word/media/')) continue
        const data = media.get(mediaPath)
        if (!data) continue
        const extension = getImageExtension(data)
        if (!extension) {
            const error = new Error('O documento contém uma imagem em formato não suportado.')
            error.status = 422
            throw error
        }
        imageIndexes.set(markerIndex, images.length)
        images.push({ data, extension })
    }
    const numberingCounters = new Map()
    for (const paragraph of paragraphs) {
        if (!paragraph.numbered || paragraph.listType !== 'ol') continue
        let counters = numberingCounters.get(paragraph.numberingId)
        if (!counters) {
            counters = []
            numberingCounters.set(paragraph.numberingId, counters)
        }
        const level = paragraph.numberingLevel
        counters.length = level + 1
        counters[level] = counters[level] === undefined
            ? paragraph.numberingStart
            : counters[level] + 1
        const numbering = numberingInstances.get(paragraph.numberingId)
        const abstractLevels = abstractNumbering.get(numbering?.abstractId)
        paragraph.numberLabel = paragraph.numberingText.replace(/%([1-9])/g, (_, index) => {
            const referencedLevel = Number(index) - 1
            const referencedCount = counters[referencedLevel] || 1
            const referencedFormat = numbering?.levels.get(referencedLevel)?.format ||
                abstractLevels?.get(referencedLevel)?.format || 'decimal'
            return formatListNumber(referencedCount, referencedFormat)
        })
    }

    let html = ''
    let listType = null
    for (const paragraph of paragraphs) {
        const content = paragraph.html.replace(/@@IMAGE_(\d+)@@/g, (_, markerIndex) => {
                const imageIndex = imageIndexes.get(Number(markerIndex))
                return imageIndex === undefined ? '' : `@@KNOWLEDGE_IMAGE_${imageIndex}@@`
            })
        const isBullet = paragraph.numbered && paragraph.listType === 'ul'
        if (isBullet && listType !== 'ul') {
            if (listType) html += `</${listType}>`
            listType = 'ul'
            html += '<ul>'
        } else if (!isBullet && listType) {
            html += `</${listType}>`
            listType = null
        }
        const heading = /^Heading([1-6])$/i.exec(paragraph.style)
        const numberedContent = paragraph.numberLabel
            ? `${paragraph.numberLabel} ${content}`
            : content
        if (isBullet) html += `<li>${content || '<br>'}</li>`
        else if (paragraph.numbered && heading) {
            html += `<h${heading[1]}>${numberedContent || '<br>'}</h${heading[1]}>`
        } else if (paragraph.numbered) html += `<p>${numberedContent || '<br>'}</p>`
        else if (heading) html += `<h${heading[1]}>${content || '<br>'}</h${heading[1]}>`
        else html += `<p>${content || '<br>'}</p>`
    }
    if (listType) html += `</${listType}>`
    const text = paragraphs.map(paragraph => paragraph.html.replace(/<[^>]*>/g, '').replace(/@@IMAGE_\d+@@/g, '')).join('\n')
    return { text, html, images }
}

const validateDocx = buffer => new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, zipFile) => {
        if (error) return reject(error)

        let expandedSize = 0
        let entryCount = 0
        const relevantEntries = new Map()
        let settled = false
        const fail = validationError => {
            if (settled) return
            settled = true
            zipFile.close()
            reject(validationError)
        }

        zipFile.on('error', fail)
        zipFile.on('entry', entry => {
            entryCount++
            expandedSize += entry.uncompressedSize
            if (entryCount > 2000 || expandedSize > maximumDocxExpandedSize) {
                return fail(new Error('O arquivo DOCX excede os limites de extração.'))
            }
            if (entry.fileName === 'word/document.xml' ||
                entry.fileName === 'word/_rels/document.xml.rels' ||
                entry.fileName === 'word/numbering.xml' ||
                entry.fileName.startsWith('word/media/')) {
                return zipFile.openReadStream(entry, (streamError, stream) => {
                    if (streamError) return fail(streamError)
                    const chunks = []
                    stream.on('data', chunk => chunks.push(chunk))
                    stream.on('error', fail)
                    stream.on('end', () => {
                        relevantEntries.set(entry.fileName, Buffer.concat(chunks))
                        zipFile.readEntry()
                    })
                })
            }
            zipFile.readEntry()
        })
        zipFile.on('end', () => {
            if (settled) return
            settled = true
            const documentXml = relevantEntries.get('word/document.xml')
            if (!documentXml) {
                return reject(new Error('O arquivo não contém um documento Word válido.'))
            }

            try {
                const media = new Map(Array.from(relevantEntries)
                    .filter(([name]) => name.startsWith('word/media/')))
                resolve(parseDocxContent(
                    documentXml.toString('utf8'),
                    relevantEntries.get('word/_rels/document.xml.rels')?.toString('utf8'),
                    relevantEntries.get('word/numbering.xml')?.toString('utf8'),
                    media
                ))
            } catch (parseError) {
                reject(parseError)
            }
        })
        zipFile.readEntry()
    })
})

const extractDocumentContent = async (buffer, extension) => {
    if (extension === '.pdf') {
        if (buffer.subarray(0, 5).toString() !== '%PDF-') {
            throw new Error('O conteúdo do arquivo não corresponde a um PDF.')
        }

        const parser = new PDFParse({ data: buffer })
        try {
            const textResult = await parser.getText()
            const imageResult = await parser.getImage({ imageThreshold: 0 })
            const images = imageResult.pages.flatMap(page => page.images.map(image => {
                const data = Buffer.from(image.data)
                const extension = getImageExtension(data)
                if (!extension) {
                    const error = new Error('O PDF contém uma imagem em formato não suportado.')
                    error.status = 422
                    throw error
                }
                return { data, extension }
            }))
            return { text: textResult.text, images }
        } finally {
            await parser.destroy()
        }
    }

    if (extension === '.docx') {
        return validateDocx(buffer)
    }

    const expectedSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])
    if (!buffer.subarray(0, expectedSignature.length).equals(expectedSignature)) {
        throw new Error('O conteúdo do arquivo não corresponde a um DOC.')
    }
    const document = await new WordExtractor().extract(buffer)
    return { text: document.getBody(), images: [] }
}

const extractText = async (buffer, extension) =>
    (await extractDocumentContent(buffer, extension)).text

const publicAttachment = attachment => ({
    id: attachment.id,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    createdAt: attachment.createdAt
})

const createAttachmentsApi = app => {
    const handlePreview = (req, res) => {
        upload.single('file')(req, res, async error => {
            if (error) {
                const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : (error.status || 400)
                return res.status(status).send(
                    status === 413 ? 'O arquivo excede o limite de 20 MB.' : error.message
                )
            }
            if (!req.file) return res.status(400).send('Selecione um arquivo para importar.')

            try {
                const extension = path.extname(req.file.originalname).toLowerCase()
                const extracted = await extractDocumentContent(req.file.buffer, extension)
                extracted.text = cleanText(extracted.text)
                const imageBytes = extracted.images.reduce((total, image) => total + image.data.length, 0)
                if (imageBytes > maximumExtractedImageBytes) {
                    return res.status(413).send('As imagens extraídas excedem o limite de 10 MB.')
                }
                if (extracted.text.length > maximumExtractedCharacters) {
                    return res.status(413).send('O texto extraído excede o limite de 1 milhão de caracteres.')
                }
                if (!extracted.text && !extracted.images.length) {
                    return res.status(422).send('O arquivo não contém texto ou imagens para importar.')
                }
                const images = extracted.images.map((image, index) => {
                    const mime = image.extension === 'jpg' ? 'image/jpeg' : `image/${image.extension}`
                    return {
                        index,
                        extension: image.extension,
                        dataUrl: `data:${mime};base64,${image.data.toString('base64')}`
                    }
                })
                return res.json({ text: extracted.text, html: extracted.html || null, images })
            } catch (parseError) {
                console.error('Falha ao gerar prévia do documento:', parseError)
                return res.status(parseError.status || 422).send(
                    'Não foi possível ler o arquivo. Verifique se ele não está corrompido ou protegido por senha.'
                )
            }
        })
    }

    const handleUpload = (req, res) => {
        upload.single('file')(req, res, async error => {
            if (error) {
                const status = error.code === 'LIMIT_FILE_SIZE'
                    ? 413
                    : (error.status || 400)
                return res.status(status).send(
                    status === 413
                        ? 'O arquivo excede o limite de 20 MB.'
                        : error.message
                )
            }
            if (!req.file) return res.status(400).send('Selecione um arquivo para importar.')

            const articleId = req.params.id
            const extension = path.extname(req.file.originalname).toLowerCase()
            let storedPath

            try {
                const article = await app.db('articles')
                    .where({ id: articleId })
                    .first('id')
                if (!article) return res.status(404).send('Artigo não encontrado.')

                let extractedContent
                try {
                    extractedContent = await extractDocumentContent(req.file.buffer, extension)
                    extractedContent.text = cleanText(extractedContent.text)
                    const imageBytes = extractedContent.images.reduce(
                        (total, image) => total + image.data.length, 0
                    )
                    if (imageBytes > maximumExtractedImageBytes) {
                        const sizeError = new Error(
                            'As imagens extraídas excedem o limite de 10 MB.'
                        )
                        sizeError.status = 413
                        throw sizeError
                    }
                } catch (parseError) {
                    console.error('Falha ao extrair texto do anexo:', parseError)
                    return res.status(parseError.status || 422).send(
                        parseError.status === 413
                            ? parseError.message
                            : 'Não foi possível ler o arquivo. Verifique se ele não está corrompido ou protegido por senha.'
                    )
                }

                if (!extractedContent.text && !extractedContent.images.length) {
                    return res.status(422).send('O arquivo não contém texto ou imagens para importar.')
                }
                if (extractedContent.text.length > maximumExtractedCharacters) {
                    return res.status(413).send(
                        'O texto extraído excede o limite de 1 milhão de caracteres.'
                    )
                }

                const originalName = path.basename(req.file.originalname.replace(/\\/g, '/'))
                    .replace(/[\u0000-\u001F\u007F]/g, '')
                    .slice(0, 255)
                    || `documento${extension}`
                const storedName = `${randomUUID()}/source${extension}`
                await fs.promises.mkdir(storageDirectory, { recursive: true })
                const attachmentDirectory = path.join(storageDirectory, path.dirname(storedName))
                await fs.promises.mkdir(attachmentDirectory, { recursive: true })
                storedPath = path.join(storageDirectory, storedName)
                await fs.promises.writeFile(storedPath, req.file.buffer, { flag: 'wx' })
                for (const [index, image] of extractedContent.images.entries()) {
                    await fs.promises.writeFile(
                        path.join(attachmentDirectory, `image-${index}.${image.extension}`),
                        image.data,
                        { flag: 'wx' }
                    )
                }

                const [attachment] = await app.db('article_attachments')
                    .insert({
                        articleId,
                        originalName,
                        storedName,
                        mimeType: mimeTypes[extension],
                        size: req.file.size
                    })
                    .returning(['id', 'originalName', 'mimeType', 'size', 'createdAt'])

                return res.status(201).json({
                    attachment: publicAttachment(attachment),
                    text: extractedContent.text,
                    html: extractedContent.html || null,
                    images: extractedContent.images.map((image, index) => ({
                        index,
                        extension: image.extension
                    }))
                })
            } catch (saveError) {
                if (storedPath) {
                    await fs.promises.rm(path.dirname(storedPath), {
                        recursive: true,
                        force: true
                    }).catch(unlinkError => {
                        console.error('Falha ao remover upload incompleto:', unlinkError)
                    })
                }
                console.error('Falha ao armazenar anexo do artigo:', saveError)
                return res.status(500).send('Não foi possível armazenar o arquivo.')
            }
        })
    }

    const download = async (req, res) => {
        try {
            const attachment = await app.db('article_attachments')
                .where({ id: req.params.attachmentId, articleId: req.params.id })
                .first()

            if (!attachment) return res.status(404).send('Arquivo não encontrado.')

            const filePath = path.join(storageDirectory, attachment.storedName)
            res.set('X-Content-Type-Options', 'nosniff')
            res.download(filePath, attachment.originalName, error => {
                if (error && !res.headersSent) {
                    if (error.code === 'ENOENT') {
                        return res.status(404).send('O arquivo não está disponível no armazenamento.')
                    }
                    console.error('Falha ao enviar anexo:', error)
                    return res.status(500).send('Não foi possível baixar o arquivo.')
                }
            })
        } catch (error) {
            console.error('Falha ao localizar anexo:', error)
            res.status(500).send('Não foi possível localizar o arquivo.')
        }
    }

    const downloadImage = async (req, res) => {
        const match = /^(\d+)\.(png|jpg|gif|webp)$/.exec(req.params.imageId)
        if (!match) return res.status(404).send('Imagem não encontrada.')

        try {
            const attachment = await app.db('article_attachments')
                .where({ id: req.params.attachmentId, articleId: req.params.id })
                .first('storedName')
            if (!attachment) return res.status(404).send('Imagem não encontrada.')
            const attachmentDirectory = path.dirname(attachment.storedName)
            if (!/^[0-9a-f-]{36}$/i.test(attachmentDirectory)) {
                return res.status(404).send('Imagem não encontrada.')
            }

            const imagePath = path.join(
                storageDirectory,
                attachmentDirectory,
                `image-${match[1]}.${match[2]}`
            )
            res.set({
                'Content-Type': `image/${match[2] === 'jpg' ? 'jpeg' : match[2]}`,
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'private, max-age=3600'
            })
            return res.sendFile(imagePath, error => {
                if (error && !res.headersSent) {
                    if (error.code === 'ENOENT') {
                        return res.status(404).send('Imagem não encontrada.')
                    }
                    console.error('Falha ao enviar imagem extraída:', error)
                    return res.status(500).send('Não foi possível carregar a imagem.')
                }
            })
        } catch (error) {
            console.error('Falha ao localizar imagem extraída:', error)
            return res.status(500).send('Não foi possível localizar a imagem.')
        }
    }

    const removeStoredFiles = async attachments => {
        const results = await Promise.allSettled(attachments.map(attachment => {
            const directory = path.dirname(attachment.storedName)
            if (/^[0-9a-f-]{36}$/i.test(directory)) {
                return fs.promises.rm(path.join(storageDirectory, directory), {
                    recursive: true,
                    force: true
                })
            }
            return fs.promises.unlink(path.join(storageDirectory, attachment.storedName))
        }))
        const failures = results.filter(result =>
            result.status === 'rejected' && result.reason.code !== 'ENOENT'
        )
        if (failures.length) {
            failures.forEach(result => console.error(
                'Falha ao remover arquivo anexado:', result.reason
            ))
            throw new Error('Um ou mais arquivos anexados não puderam ser removidos.')
        }
    }

    return { handlePreview, handleUpload, download, downloadImage, removeStoredFiles }
}

createAttachmentsApi.extractText = extractText
createAttachmentsApi.extractDocumentContent = extractDocumentContent

module.exports = createAttachmentsApi

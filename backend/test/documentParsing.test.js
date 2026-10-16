const assert = require('node:assert/strict')
const { test } = require('node:test')
const { deflateSync } = require('node:zlib')
const { extractDocumentContent, extractText } = require('../api/attachments')

const crc32 = buffer => {
    let crc = 0xFFFFFFFF
    for (const byte of buffer) {
        crc ^= byte
        for (let bit = 0; bit < 8; bit++) {
            crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0)
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0
}

const createZip = entries => {
    const localRecords = []
    const centralRecords = []
    let offset = 0

    for (const [fileName, content] of entries) {
        const name = Buffer.from(fileName)
        const data = Buffer.from(content)
        const checksum = crc32(data)
        const localHeader = Buffer.alloc(30)
        localHeader.writeUInt32LE(0x04034B50, 0)
        localHeader.writeUInt16LE(20, 4)
        localHeader.writeUInt16LE(0x800, 6)
        localHeader.writeUInt32LE(checksum, 14)
        localHeader.writeUInt32LE(data.length, 18)
        localHeader.writeUInt32LE(data.length, 22)
        localHeader.writeUInt16LE(name.length, 26)
        localRecords.push(localHeader, name, data)

        const centralHeader = Buffer.alloc(46)
        centralHeader.writeUInt32LE(0x02014B50, 0)
        centralHeader.writeUInt16LE(20, 4)
        centralHeader.writeUInt16LE(20, 6)
        centralHeader.writeUInt16LE(0x800, 8)
        centralHeader.writeUInt32LE(checksum, 16)
        centralHeader.writeUInt32LE(data.length, 20)
        centralHeader.writeUInt32LE(data.length, 24)
        centralHeader.writeUInt16LE(name.length, 28)
        centralHeader.writeUInt32LE(offset, 42)
        centralRecords.push(centralHeader, name)
        offset += localHeader.length + name.length + data.length
    }

    const centralDirectory = Buffer.concat(centralRecords)
    const end = Buffer.alloc(22)
    end.writeUInt32LE(0x06054B50, 0)
    end.writeUInt16LE(entries.length, 8)
    end.writeUInt16LE(entries.length, 10)
    end.writeUInt32LE(centralDirectory.length, 12)
    end.writeUInt32LE(offset, 16)
    return Buffer.concat([...localRecords, centralDirectory, end])
}

const createPdf = text => {
    const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
    ]
    let document = '%PDF-1.4\n'
    const offsets = [0]
    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(document))
        document += `${index + 1} 0 obj\n${object}\nendobj\n`
    })
    const xrefOffset = Buffer.byteLength(document)
    document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    document += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
    document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    return Buffer.from(document)
}

const createPdfWithImage = () => {
    const imageData = deflateSync(Buffer.from([255, 0, 0]))
    const content = 'q 10 0 0 10 10 10 cm /Im1 Do Q'
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im1 6 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
        `<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${imageData.length} >>\nstream\n${imageData.toString('binary')}\nendstream`
    ]
    let document = '%PDF-1.4\n'
    const offsets = [0]
    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(document, 'binary'))
        document += `${index + 1} 0 obj\n${object}\nendobj\n`
    })
    const xrefOffset = Buffer.byteLength(document, 'binary')
    document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    document += offsets.slice(1)
        .map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`)
        .join('')
    document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    return Buffer.from(document, 'binary')
}

test('extrai texto de PDF', async () => {
    const text = await extractText(createPdf('Texto PDF'), '.pdf')
    assert.match(text, /Texto PDF/)
})

test('extrai imagens incorporadas em PDF', async () => {
    const content = await extractDocumentContent(createPdfWithImage(), '.pdf')
    assert.equal(content.images.length, 1)
    assert.equal(content.images[0].extension, 'png')
    assert.ok(content.images[0].data.length > 0)
})

test('extrai texto de DOCX e preserva quebras de parágrafo', async () => {
    const xml = '<w:document xmlns:w="urn:word"><w:body><w:p><w:r><w:t>Primeira linha</w:t></w:r></w:p><w:p><w:r><w:t>Segunda linha</w:t></w:r></w:p></w:body></w:document>'
    const docx = createZip([['word/document.xml', xml]])
    const text = await extractText(docx, '.docx')
    assert.equal(text, 'Primeira linha\nSegunda linha')
})

test('extrai imagens DOCX referenciadas no documento', async () => {
    const image = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p3sAAAAASUVORK5CYII=',
        'base64'
    )
    const documentXml = '<w:document xmlns:w="urn:word" xmlns:a="urn:drawing" xmlns:r="urn:relationships"><w:body><w:p><w:r><w:t>Texto antes</w:t><w:drawing><a:blip r:embed="rId1"/></w:drawing></w:r></w:p></w:body></w:document>'
    const relationshipsXml = '<Relationships><Relationship Id="rId1" Target="media/image1.png"/></Relationships>'
    const docx = createZip([
        ['word/document.xml', documentXml],
        ['word/_rels/document.xml.rels', relationshipsXml],
        ['word/media/image1.png', image],
        ['word/media/unused.png', image]
    ])
    const content = await extractDocumentContent(docx, '.docx')
    assert.equal(content.text, 'Texto antes')
    assert.equal(content.images.length, 1)
    assert.equal(content.images[0].extension, 'png')
    assert.deepEqual(content.images[0].data, image)
})

test('rejeita arquivos com extensão PDF e conteúdo incompatível', async () => {
    await assert.rejects(
        extractText(Buffer.from('não é um PDF'), '.pdf'),
        /não corresponde a um PDF/
    )
})

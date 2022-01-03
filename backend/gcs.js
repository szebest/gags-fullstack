const fs = require('fs')
const { Duplex } = require('stream')
const { google } = require('googleapis')

const SCOPES = ['https://www.googleapis.com/auth/drive']

const auth = new google.auth.GoogleAuth({
    keyFile: `${__dirname}\\glassy-courage-326311-637c273863cd.json`,
    scopes: SCOPES
})

const driveService = google.drive({
    version: 'v3',
    auth
})

function bufferToStream(buffer) {
    let tmp = new Duplex()
    tmp.push(new Uint8Array(buffer))
    tmp.push(null)
    return tmp
}

const uploadFile = async (mimeType, originalname, buffer, folderName) => {
    let fileMetaData = {
        name: originalname,
        parents: [folderName]
    }

    let media = {
        mimeType: mimeType,
        body: bufferToStream(buffer)
    }

    let response = await driveService.files.create({
        resource: fileMetaData,
        media,
        fields: 'id'
    })

    return `https://drive.google.com/uc?export=view&id=${response.data.id}`
}

exports.uploadFile = uploadFile
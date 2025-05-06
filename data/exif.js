import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import Crypto from 'crypto';
import ff from 'fluent-ffmpeg';
import { fileTypeFromBuffer } from 'file-type';
import webp from 'node-webpmux';
import { tmpdir } from 'os';

const temp = './temp';

export async function imageToWebp(input, saveToFile = false) {
    let tmpFileIn, tmpFileOut;

    if (Buffer.isBuffer(input)) {
        const ext = await detectImageExtension(input);
        tmpFileIn = path.join(temp, `${generateRandomFileName()}.${ext}`);
        await fs.writeFile(tmpFileIn, input);
    } else if (typeof input === 'string') {
        if (!existsSync(input)) throw new Error('File not found');
        tmpFileIn = input;
    } else {
        throw new Error('Invalid input type');
    }

    tmpFileOut = path.join(temp, `${generateRandomFileName()}.webp`);
    try {
        await convertToWebp(tmpFileIn, tmpFileOut);
        const resultBuffer = await fs.readFile(tmpFileOut);

        if (!saveToFile) {
            await fs.unlink(tmpFileIn);
            await fs.unlink(tmpFileOut);
            return resultBuffer;
        }
        return tmpFileOut;
    } catch (e) {
        await cleanUpFiles(tmpFileIn, tmpFileOut);
        throw e;
    }
}

export async function videoToWebp(input, saveToFile = false) {
    let tmpFileIn, tmpFileOut;
    let isTempFile = false;

    if (Buffer.isBuffer(input)) {
        const type = await fileTypeFromBuffer(input);
        if (!type || !['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(type.ext)) {
            throw new Error(`Unsupported video format: ${type ? type.ext : 'unknown'}`);
        }
        tmpFileIn = path.join(temp, `${generateRandomFileName()}.${type.ext}`);
        await fs.writeFile(tmpFileIn, input);
        isTempFile = true;
    } else if (typeof input === 'string') {
        if (!existsSync(input)) throw new Error('File not found');
        tmpFileIn = input;
    } else {
        throw new Error('Invalid input type');
    }

    tmpFileOut = path.join(temp, `${generateRandomFileName()}.webp`);
    try {
        await convertToWebp(tmpFileIn, tmpFileOut);
        const resultBuffer = await fs.readFile(tmpFileOut);

        if (!saveToFile) {
            if (isTempFile) await fs.unlink(tmpFileIn);
            await fs.unlink(tmpFileOut);
            return resultBuffer;
        }
        return tmpFileOut;
    } catch (e) {
        if (isTempFile) await fs.unlink(tmpFileIn);
        await fs.unlink(tmpFileOut);
        throw e;
    }
}

async function detectImageExtension(buffer) {
    const type = await fileTypeFromBuffer(buffer);
    if (!type || !['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(type.ext)) {
        throw new Error('Unsupported image format');
    }
    return type.ext;
}

function generateRandomFileName() {
    return Crypto.randomBytes(6).readUIntLE(0, 6).toString(36);
}

async function convertToWebp(inputPath, outputPath) {
    await new Promise((resolve, reject) => {
        let command = ff(inputPath)
            .on('error', reject)
            .on('end', resolve)
            .addOutputOptions([
                '-vcodec', 'libwebp',
                '-filter:v', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,pad=320:320:-1:-1:color=white@0.0,fps=15",
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0'
            ]);

        command.toFormat('webp').save(outputPath);
    });
}

async function cleanUpFiles(tmpFileIn, tmpFileOut) {
    if (existsSync(tmpFileIn)) await fs.unlink(tmpFileIn);
    if (existsSync(tmpFileOut)) await fs.unlink(tmpFileOut);
}

export async function writeExifImg(media, metadata) {
    let wMedia = await imageToWebp(media);
    return await addExif(wMedia, metadata);
}

export async function writeExifVid(media, metadata) {
    let wMedia = await videoToWebp(media);
    return await addExif(wMedia, metadata);
}

async function addExif(media, metadata) {
    const tmpFileIn = path.join(tmpdir(), `${generateRandomFileName()}.webp`);
    const tmpFileOut = path.join(tmpdir(), `${generateRandomFileName()}.webp`);
    await fs.writeFile(tmpFileIn, media);

    if (metadata.packname || metadata.author) {
        const img = new webp.Image();
        const json = {
            "sticker-pack-id": `Matzz`,
            "sticker-pack-name": metadata.packname,
            "sticker-pack-publisher": metadata.author,
            "emojis": metadata.categories || ["🎥"]
        };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
        const exif = Buffer.concat([exifAttr, jsonBuff]);
        exif.writeUIntLE(jsonBuff.length, 14, 4);

        await img.load(tmpFileIn);
        await fs.unlink(tmpFileIn);
        img.exif = exif;
        await img.save(tmpFileOut);
        return tmpFileOut;
    }
}
#!/usr/bin/env node
/*
 * Проверка файла репутации.
 *
 *   node scripts/validate.js [путь к reputation.json]
 *
 * Проверяет, что JSON валиден, все ключи — SteamID64 из 17 цифр,
 * а записи имеют допустимые поля. Код возврата 1 при любой ошибке.
 */

const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, '..', 'reputation.json');
const errors = [];

// Некоторые редакторы пишут файл с BOM — JSON.parse на нём падает
const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');

let data;
try {
    data = JSON.parse(raw);
} catch (e) {
    console.error('FAIL: не удалось разобрать JSON — ' + e.message);
    process.exit(1);
}

if (!data || typeof data !== 'object' || Array.isArray(data)) {
    errors.push('корень должен быть объектом');
}

const users = (data && data.users) ? data.users : null;
if (!users || typeof users !== 'object' || Array.isArray(users)) {
    errors.push('нет объекта "users"');
}

if (users) {
    for (const [id, entry] of Object.entries(users)) {
        if (!/^\d{17}$/.test(id)) {
            errors.push('ключ "' + id + '" не похож на SteamID64 (17 цифр)');
            continue;
        }

        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            errors.push(id + ': запись должна быть объектом');
            continue;
        }

        if (entry.rep !== undefined && ![1, 0, -1].includes(Number(entry.rep))) {
            errors.push(id + ': rep должен быть 1, 0 или -1 (сейчас ' + JSON.stringify(entry.rep) + ')');
        }

        if (entry.tag !== undefined && (typeof entry.tag !== 'string' || entry.tag.length > 24)) {
            errors.push(id + ': tag должен быть строкой до 24 символов');
        }

        if (entry.note !== undefined && (typeof entry.note !== 'string' || entry.note.length > 140)) {
            errors.push(id + ': note должен быть строкой до 140 символов');
        }

        if (entry.by !== undefined && (typeof entry.by !== 'string' || entry.by.length > 40)) {
            errors.push(id + ': by должен быть строкой до 40 символов');
        }
    }
}

if (errors.length) {
    console.error('FAIL: найдено проблем — ' + errors.length);
    for (const e of errors) console.error('  · ' + e);
    process.exit(1);
}

const count = users ? Object.keys(users).length : 0;
console.log('OK: ' + count + ' записей' + (data.updated ? ', updated ' + data.updated : ''));

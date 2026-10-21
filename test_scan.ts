import { analyzeScan } from './src/lib/api/scan.ts';
import fs from 'fs';

async function run() {
  const imagePath = 'C:/Users/HP/.gemini/antigravity/brain/e1547d65-9266-4d8c-9db1-4d6502e15664/.user_uploaded/media_1791303850761.jpg';
  
  // Read file as base64
  const base64 = fs.readFileSync(imagePath).toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64}`;

  console.log('Running scan on newly uploaded image...');
  try {
    const result = await analyzeScan(dataUrl);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();

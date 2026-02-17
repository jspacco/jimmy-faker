import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const personasDirectory = path.join(process.cwd(), 'personas');
    
    // Create folder if it doesn't exist (safety for first-time faculty setup)
    if (!fs.existsSync(personasDirectory)) {
      return NextResponse.json(['jimmy']); 
    }

    const files = fs.readdirSync(personasDirectory);
    // Remove the .txt extension for the UI names
    const personaNames = files
      .filter(file => file.endsWith('.txt'))
      .map(file => file.replace('.txt', ''));

    return NextResponse.json(personaNames);
  } catch (error) {
    return NextResponse.json(['jimmy'], { status: 200 });
  }
}
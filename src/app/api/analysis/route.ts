import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticker, endDate, lookbackDays, crossoverDays } = body;

    // Construct Python script arguments
    const args = [
      ticker,
      endDate || '',
      lookbackDays || '365',
      crossoverDays || '180'
    ];

    // Spawn Python process
    const pythonProcess = spawn('python', [
      path.join(process.cwd(), 'api/python/analysis.py'),
      ...args
    ]);

    let outputData = '';
    let errorData = '';

    // Collect output data
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    // Handle process completion
    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(outputData);
        } else {
          reject(new Error(`Python process exited with code ${code}\n${errorData}`));
        }
      });
    });

    // Return HTML response
    return new NextResponse(outputData, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Analysis failed:', error);
    
    // Properly type check the error
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json(
      { message: 'Analysis failed', error: errorMessage },
      { status: 500 }
    );
  }
}

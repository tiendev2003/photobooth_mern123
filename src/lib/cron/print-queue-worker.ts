import { exec } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

/**
 * Process the print queue folder and print any pending files
 * This script can be run as a cron job on the server or manually when needed
 */
async function processPrintQueue() {
  const printQueuePath = path.join(process.cwd(), 'public', 'uploads', 'print_queue');
  
  try {
    // Create the directory if it doesn't exist
    await fs.mkdir(printQueuePath, { recursive: true });
    
    // Read all print job files
    const files = await fs.readdir(printQueuePath);
    const printInfoFiles = files.filter(file => file.startsWith('print_info_') && file.endsWith('.json'));
    
    console.log(`Found ${printInfoFiles.length} print jobs in queue`);
    
    for (const infoFile of printInfoFiles) {
      try {
        const infoFilePath = path.join(printQueuePath, infoFile);
        const infoContent = await fs.readFile(infoFilePath, 'utf8');
        const printJob = JSON.parse(infoContent);
        
        console.log(`Processing print job: ${printJob.filePath}`);
        
        // Check if the image file still exists
        try {
          await fs.access(printJob.filePath);
        } catch (err) {
          console.error(`Image file not found: ${printJob.filePath} ${err}`);
          await fs.unlink(infoFilePath).catch(() => {});
          continue;
        }
        
        // Execute the print command based on the platform
        const platform = os.platform();
        let printed = false;
        
        if (platform === 'win32') {
          // Windows printing
          const printCommand = `rundll32 C:\\\\Windows\\\\System32\\\\shimgvw.dll,ImageView_PrintTo /pt "${printJob.filePath}" ${printJob.printer}`;
          await new Promise((resolve) => {
            exec(printCommand, (error) => {
              if (error) {
                console.error(`Print error: ${error.message}`);
              } else {
                console.log(`Successfully printed: ${printJob.filePath}`);
                printed = true;
              }
              resolve(null);
            });
          });
        } else if (platform === 'linux') {
          // Linux printing using CUPS (if installed)
          try {
            const printCommand = `lp -d ${printJob.printer} "${printJob.filePath}"`;
            await new Promise((resolve) => {
              exec(printCommand, (error) => {
                if (error) {
                  console.error(`Print error on Linux: ${error.message}`);
                } else {
                  console.log(`Successfully printed on Linux: ${printJob.filePath}`);
                  printed = true;
                }
                resolve(null);
              });
            });
          } catch (err) {
            console.error(`Linux printing error: ${err}`);
          }
        } else {
          console.log(`Printing not supported on platform: ${platform}`);
        }
        
        // If printed successfully, remove the job info file
        if (printed) {
          await fs.unlink(infoFilePath).catch(() => {});
          // Optionally clean up the image file too
          // await fs.unlink(printJob.filePath).catch(() => {});
        }
      } catch (err) {
        console.error(`Error processing print job ${infoFile}:`, err);
      }
    }
  } catch (err) {
    console.error('Error processing print queue:', err);
  }
}

// If this script is run directly
if (require.main === module) {
  processPrintQueue()
    .then(() => console.log('Print queue processing complete'))
    .catch((err) => console.error('Error:', err));
}

export default processPrintQueue;

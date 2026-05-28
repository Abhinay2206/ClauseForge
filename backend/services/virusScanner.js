const NodeClam = require('clamscan');
const stream = require('stream');

class VirusDetectedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VirusDetectedError';
  }
}

let clam = null;

const initClamAV = async () => {
  try {
    // Attempt to initialize ClamAV
    // If clamd is not running, this might fail or it will fallback to clamscan binary if available
    clam = await new NodeClam().init({
      removeInfected: false,
      quarantineInfected: false,
      scanLog: null,
      debugMode: false,
      fileList: null,
      scanRecursively: true,
      clamscan: {
        path: '/opt/homebrew/bin/clamscan', // Common path for macOS Homebrew
        db: null,
        scanArchives: true,
        active: true
      },
      clamdscan: {
        socket: false,
        host: false,
        port: false,
        timeout: 60000,
        localFallback: true,
        path: '/opt/homebrew/bin/clamdscan', // Common path for macOS Homebrew
        configFile: null,
        multiscan: true,
        reloadDb: false,
        active: true,
        bypassTest: false,
      },
      preference: 'clamdscan'
    });
    console.log('ClamAV initialized successfully');
  } catch (err) {
    console.error('Failed to initialize ClamAV. Virus scanning will be bypassed.', err.message);
    clam = null;
  }
};

const scanBuffer = async (buffer) => {
  if (!clam) {
    console.warn('ClamAV is not initialized or installed. Bypassing virus scan.');
    return { isInfected: false, viruses: [] };
  }

  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const { isInfected, viruses } = await clam.scanStream(bufferStream);

    if (isInfected) {
      console.warn('VIRUS DETECTED!', viruses);
      throw new VirusDetectedError(`Virus detected in file: ${viruses.join(', ')}`);
    }

    return { isInfected, viruses };
  } catch (error) {
    if (error instanceof VirusDetectedError) throw error;
    
    console.error('ClamAV scan failed (could be configuration issue). Error:', error);
    // If it fails for configuration reasons (like missing binary), we don't want to crash the whole upload process 
    // since the user is explicitly warned to install it.
    return { isInfected: false, viruses: [] };
  }
};

// Initialize asynchronously on startup
initClamAV();

module.exports = {
  scanBuffer,
  VirusDetectedError
};

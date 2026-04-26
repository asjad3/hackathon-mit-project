import * as FileSystem from 'expo-file-system';

export const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
export const MODEL_FILENAME = 'Phi-3-mini-4k-instruct-Q4_K_M.gguf';
export const MODEL_PATH = `${MODEL_DIR}${MODEL_FILENAME}`;

/**
 * Get the path to the model file.
 * If the model doesn't exist in the document directory, copy it from assets.
 */
export async function getModelPath(): Promise<string> {
  // Check if model exists in document directory
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  
  if (!info.exists) {
    console.log('Model not found in document directory, copying from assets...');
    
    // Create models directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(MODEL_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
    }
    
    // Copy from assets
    const assetUri = `assets/models/${MODEL_FILENAME}`;
    try {
      await FileSystem.copyAsync({
        from: assetUri,
        to: MODEL_PATH
      });
      console.log('Model copied successfully');
    } catch (error) {
      console.error('Failed to copy model from assets:', error);
      throw new Error(
        `Model file not found. Please download Phi-3-mini-4k-instruct-Q4_K_M.gguf ` +
        `and place it at assets/models/${MODEL_FILENAME}. ` +
        `Error: ${error}`
      );
    }
  }
  
  return MODEL_PATH;
}

/**
 * Check if the model file exists and is accessible.
 */
export async function checkModelExists(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Send a ticket image to the backend for nutritional analysis.
 * @param {File} file - The image file uploaded by the user.
 * @param {{ currentWeightKg?: number|null, idealWeightKg?: number|null }} [profile] - Optional user profile for personalized recommendations.
 * @returns {Promise<object>} Parsed analysis JSON.
 */
export async function analyzeTicket(file, profile = {}, options = {}) {
  const base64 = await fileToBase64(file);

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: base64,
      mediaType: file.type || 'image/jpeg',
      currentWeightKg: profile.currentWeightKg ?? null,
      idealWeightKg: profile.idealWeightKg ?? null,
      language: options.language ?? 'auto',
      fallbackLanguage: options.fallbackLanguage ?? 'es',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  return response.json();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Strip the "data:image/jpeg;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

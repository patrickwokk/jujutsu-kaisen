// Optional Vercel serverless function: serve the Roboflow publishable key
// from an environment variable so it doesn't live in the committed HTML.
// Set ROBOFLOW_PUBLISHABLE_KEY in the Vercel project settings to use it;
// the client falls back to its embedded key when this returns null.
// CommonJS on purpose — the repo has no "type":"module" in package.json.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json({ key: process.env.ROBOFLOW_PUBLISHABLE_KEY || null });
};

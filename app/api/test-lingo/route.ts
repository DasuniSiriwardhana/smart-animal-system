export async function GET() {
  const apiKey = process.env.LINGODOTDEV_API_KEY;
  return Response.json({
    hasKey: !!apiKey,
    keyPrefix: apiKey?.substring(0, 15),
    keyLength: apiKey?.length
  });
}
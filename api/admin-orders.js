export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const password = req.headers.authorization;

  if (
    !password ||
    password !== `Bearer ${process.env.ADMIN_PASSWORD}`
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`,
      {
        method: "GET",
        headers: {
          "apikey": process.env.SUPABASE_SECRET_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SECRET_KEY}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Supabase error:", errorText);

      return res.status(500).json({
        success: false,
        message: "Unable to load orders"
      });
    }

    const orders = await response.json();

    return res.status(200).json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error("Admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load orders"
    });
  }
}

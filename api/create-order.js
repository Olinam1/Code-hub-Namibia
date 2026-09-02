export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const {
      product,
      price,
      quantity,
      email
    } = req.body || {};

    if (!product || !price || !quantity || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing order information"
      });
    }

    const orderNumber =
      "CHN-" + Date.now().toString().slice(-8);

    const total =
      Number(price) * Number(quantity);

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SECRET_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          order_number: orderNumber,
          product: product,
          price: Number(price),
          quantity: Number(quantity),
          total: total,
          email: email,
          payment_status: "awaiting_payment",
          voucher_status: "not_fulfilled"
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(500).json({
        success: false,
        supabase_status: response.status,
        supabase_error: errorText
      });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      order: data[0]
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

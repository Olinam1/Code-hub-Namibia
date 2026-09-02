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

    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity"
      });
    }

    if (
      typeof email !== "string" ||
      !email.includes("@")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email"
      });
    }

    const orderNumber =
      "CHN-" + Date.now().toString().slice(-8);

    const total =
      Number(price) * Number(quantity);

    // Save order to Supabase
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
      console.error("Supabase error:", errorText);

      return res.status(500).json({
        success: false,
        supabase_status: response.status,
        supabase_error: errorText,
        message: "Unable to save order"
      });
    }

    const data = await response.json();
    const order = data[0];

    // Send confirmation email through Resend
    const emailResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "Code Hub Namibia <onboarding@resend.dev>",
          to: [email],
          subject: `Order #${orderNumber} — Code Hub Namibia`,
          html: `
            <div style="margin:0;padding:0;background:#0b0f14;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
              
              <div style="max-width:600px;margin:0 auto;padding:30px 20px;">
                
                <div style="text-align:center;padding:20px 0 30px;">
                  <h1 style="margin:0;font-size:28px;letter-spacing:2px;color:#00e5ff;">
                    CODE HUB NAMIBIA
                  </h1>
                  <p style="margin:8px 0 0;color:#9aa4af;font-size:14px;">
                    Digital Gaming Store 🇳🇦
                  </p>
                </div>

                <div style="background:#121820;border:1px solid #26313c;border-radius:12px;padding:28px;">
                  
                  <h2 style="margin:0 0 8px;font-size:24px;">
                    Order Received ✓
                  </h2>

                  <p style="margin:0 0 25px;color:#aeb8c2;">
                    Thanks for your order! We've received your request.
                  </p>

                  <div style="background:#0b0f14;border-radius:8px;padding:18px;margin-bottom:20px;">
                    <p style="margin:0 0 8px;color:#8d98a3;font-size:13px;">
                      ORDER NUMBER
                    </p>
                    <p style="margin:0;font-size:22px;font-weight:bold;color:#00e5ff;">
                      #${orderNumber}
                    </p>
                  </div>

                  <table style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td style="padding:10px 0;color:#9da7b1;">Product</td>
                      <td style="padding:10px 0;text-align:right;font-weight:bold;">
                        ${product}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:10px 0;color:#9da7b1;">Quantity</td>
                      <td style="padding:10px 0;text-align:right;font-weight:bold;">
                        ${quantity}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:10px 0;color:#9da7b1;">Total</td>
                      <td style="padding:10px 0;text-align:right;font-size:18px;font-weight:bold;color:#00e5ff;">
                        N$${total.toLocaleString()}
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:10px 0;color:#9da7b1;">Payment</td>
                      <td style="padding:10px 0;text-align:right;font-weight:bold;">
                        Awaiting payment
                      </td>
                    </tr>
                  </table>

                  <div style="margin-top:25px;padding:16px;background:#18212b;border-radius:8px;">
                    <p style="margin:0;color:#c6ced6;font-size:14px;line-height:1.6;">
                      Your digital voucher will be delivered after your payment
                      has been successfully confirmed.
                    </p>
                  </div>

                </div>

                <div style="text-align:center;padding:25px 10px;">
                  <p style="margin:0;color:#7f8a95;font-size:13px;">
                    Code Hub Namibia
                  </p>
                  <p style="margin:6px 0 0;color:#5f6973;font-size:12px;">
                    Game. Buy. Play.
                  </p>
                </div>

              </div>
            </div>
          `
        })
      }
    );

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error("Resend error:", emailError);
    }

    return res.status(200).json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error("Order error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Unable to create order"
    });
  }
}

export default function handler(req, res) {
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
      "CHN-" +
      Date.now().toString().slice(-8);

    const total = Number(price) * Number(quantity);

    return res.status(200).json({
      success: true,
      order: {
        orderNumber,
        product,
        quantity,
        total,
        email,
        status: "awaiting_payment"
      }
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Unable to create order"
    });

  }
}

const fetch = require("node-fetch");
const FormData = require("form-data");

const BASE_URL = "http://localhost:3000";

async function loginAsAdmin() {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@test.sg",
      password: "admin@test.sg",
    }),
  });

  const data = await res.json();
  const token = data?.token;
  if (!token) throw new Error("Failed to get admin token");

  return token;
}

async function getFirstCategoryId() {
  const res = await fetch(`${BASE_URL}/api/v1/category/get-category`);
  const data = await res.json();
  return data?.category?.[0]?._id;
}

async function createProduct({
  name,
  description = "Test description",
  price = 100,
  quantity = 10,
  shipping = 1,
  categoryId = null,
  token,
}) {
  if (!name) throw new Error("Product name is required");
  if (!token) throw new Error("Token is required to create a product");

  const resolvedCategoryId = categoryId || (await getFirstCategoryId());
  if (!resolvedCategoryId) throw new Error("No category available");

  const form = new FormData();
  form.append("name", name);
  form.append("description", description);
  form.append("price", price);
  form.append("quantity", quantity);
  form.append("shipping", shipping);
  form.append("category", resolvedCategoryId);

  const res = await fetch(`${BASE_URL}/api/v1/product/create-product`, {
    method: "POST",
    body: form,
    headers: {
      Authorization: token,
    },
  });

  const raw = await res.text();

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error("Product creation failed: Response is not valid JSON");
  }

  if (!data?.products?._id) {
    throw new Error("Product creation failed: No product ID in response");
  }

  return {
    id: data.products._id,
    slug: data.products.slug,
  };
}

async function deleteProduct(productId) {
  const res = await fetch(
    `${BASE_URL}/api/v1/product/delete-product/${productId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    console.warn(`Failed to delete product ${productId}`);
  }
}

module.exports = {
  loginAsAdmin,
  createProduct,
  deleteProduct,
};

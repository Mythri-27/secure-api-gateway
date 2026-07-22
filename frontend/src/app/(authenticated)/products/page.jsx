"use client";

import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";
import Card from "../../../components/Card";
import Badge from "../../../components/Badge";
import Alert from "../../../components/Alert";
import Spinner from "../../../components/Spinner";

function currency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function ProductCard({ product }) {
  const lowStock = product.stock <= 10;
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{product.name}</h3>
          <p className="mt-1 text-sm text-slate-500">ID #{product.id}</p>
        </div>
        <Badge variant={lowStock ? "warning" : "success"}>
          {lowStock ? "Low stock" : "In stock"}
        </Badge>
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
        <span className="text-lg font-bold text-slate-900">{currency(product.price)}</span>
        <span className="text-sm text-slate-500">{product.stock} units</span>
      </div>
    </Card>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setError("");
    try {
      // This request travels: browser → gateway (auth + role check) →
      // proxied to product-service (127.0.0.1:5002) with x-user-id /
      // x-user-role headers injected by the gateway.
      const { data } = await api.get("/products");
      setProducts(data);
    } catch (err) {
      setError(
        err.response?.status === 403
          ? "Access denied. Your role isn't permitted to view products."
          : err.response?.status === 502
            ? "The product service is currently unavailable. Try again shortly."
            : err.response?.data?.error || "Failed to load products."
      );

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <p className="text-sm text-slate-500">
          Live data from the <code className="font-mono text-xs">product-service</code> microservice,
          proxied through the gateway.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {!error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
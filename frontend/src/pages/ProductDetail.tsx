import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FileText, Download, ShoppingCart, ShieldCheck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/products/${id}`);
        setProduct(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div>Loading technical specs...</div>;
  if (!product) return <div>Material not found.</div>;

  return (
    <main className="content pdp">
      <div className="product-showcase">
        <div className="product-image-large"></div>
        <div className="product-essentials">
          <h1>{product.name}</h1>
          <p className="sku">SKU: {product.sku} | CSI: {product.csiMasterFormat}</p>
          <div className="price-tag">₹{product.price.toFixed(2)} / {product.unitLabel}</div>
          
          <div className="bulk-pricing-table">
            <h4>Bulk Discounts</h4>
            <table>
              <thead>
                <tr>
                  <th>Quantity</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {product.bulkPricing?.map((tier: any, i: number) => (
                  <tr key={i}>
                    <td>{tier.minQty}+ {product.unitLabel}s</td>
                    <td className="discount">Save {tier.discount}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => addToCart(product)} className="add-btn">
            <ShoppingCart size={20} /> Add to Cart
          </button>
        </div>
      </div>

      <div className="technical-section">
        <div className="specs-card">
          <h3><FileText size={20} /> Technical Specifications</h3>
          <table className="specs-table">
            <tbody>
              {Object.entries(product.specifications || {}).map(([key, val]: any) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{val}</td>
                </tr>
              ))}
              <tr>
                <td>Weight per Unit</td>
                <td>{product.weightPerUnit} kg</td>
              </tr>
              <tr>
                <td>Volume per Unit</td>
                <td>{product.volumePerUnit} m³</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="compliance-card">
          <h3><ShieldCheck size={20} /> Compliance & Safety</h3>
          <ul className="docs-list">
            {product.complianceDocs?.map((doc: any, i: number) => (
              <li key={i}>
                <span>{doc.label}</span>
                <Download size={16} />
              </li>
            ))}
            <li>
              <span>IS 12269:2013 (Certification)</span>
              <Download size={16} />
            </li>
            <li>
              <span>MSDS (Safety Data Sheet)</span>
              <Download size={16} />
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;

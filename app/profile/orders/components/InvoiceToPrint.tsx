import React from "react";

// Komponen ini yang akan muncul di kertas printer
export const InvoiceToPrint = React.forwardRef(({ order }: { order: any }, ref: any) => {
  if (!order) return null;

  return (
    <div ref={ref} className="p-8 bg-white text-black" style={{ minWidth: "800px" }}>
      <div className="flex justify-between border-b-2 border-gray-800 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
          <p className="text-sm text-gray-500">Terima kasih telah berbelanja!</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">PANGANESIA</p>
          <p className="text-xs text-gray-500">Bekasi, Indonesia</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-sm"><strong>Nomor Pesanan:</strong> {order.order_id}</p>
        <p className="text-sm"><strong>Tanggal:</strong> {new Date(order.tanggal_pesanan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p className="text-sm"><strong>Metode Bayar:</strong> {order.metode_bayar?.toUpperCase()}</p>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-y border-gray-800">
            <th className="py-2 text-left text-sm">Produk</th>
            <th className="py-2 text-center text-sm">Qty</th>
            <th className="py-2 text-right text-sm">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.item_pesanan?.map((item: any) => (
            <tr key={item.id_item} className="border-b border-gray-100">
              <td className="py-3 text-sm">{item.produk.nama_produk}</td>
              <td className="py-3 text-center text-sm">{item.kuantitas}</td>
              <td className="py-3 text-right text-sm">Rp {Number(item.subtotal).toLocaleString('id-ID')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between font-bold text-lg border-t-2 border-gray-800 pt-2">
            <span>Total Bayar</span>
            <span className="text-green-700">Rp {Number(order.total_harga).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

InvoiceToPrint.displayName = "InvoiceToPrint";
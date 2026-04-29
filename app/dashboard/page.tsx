'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, OrderItem, Product } from '@/types/database.types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Period = 'jour' | 'semaine' | 'mois' | 'personnalise';

interface DailySales {
  date: string;
  montant: number;
}

interface TopProduct {
  nom: string;
  quantite: number;
  ca: number;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('jour');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    const [ordersRes, itemsRes, productsRes] = await Promise.all([
      supabase.from('orders').select('*').neq('statut', 'annule').order('created_at', { ascending: false }),
      supabase.from('order_items').select('*'),
      supabase.from('products').select('*'),
    ]);

    if (ordersRes.data) setOrders(ordersRes.data);
    if (itemsRes.data) setOrderItems(itemsRes.data);
    if (productsRes.data) setProducts(productsRes.data);

    setIsLoading(false);
  };

  const getDateRange = (period: Period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'jour':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'semaine':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        return { start: weekStart, end: new Date() };
      case 'mois':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: new Date() };
      case 'personnalise':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return { start, end };
        }
        return { start: today, end: new Date() };
    }
  };

  const filterOrdersByPeriod = (period: Period) => {
    const { start, end } = getDateRange(period);
    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= start && orderDate <= end;
    });
  };

  const calculateSales = (period: Period) => {
    const filteredOrders = filterOrdersByPeriod(period);
    return filteredOrders.reduce((sum, order) => sum + order.total, 0);
  };

  const calculatePaymentSales = (period: Period, paymentType: 'especes' | 'carte') => {
    const filteredOrders = filterOrdersByPeriod(period);
    return filteredOrders
      .filter((order) => order.paiement === paymentType)
      .reduce((sum, order) => sum + order.total, 0);
  };

  const getDailySalesData = (): DailySales[] => {
    const days = selectedPeriod === 'semaine' ? 7 : 30;
    const data: DailySales[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dayStart && orderDate < dayEnd;
      });

      const montant = dayOrders.reduce((sum, order) => sum + order.total, 0);

      data.push({ date: dateStr, montant });
    }

    return data;
  };

  const getTopProducts = (): TopProduct[] => {
    const filteredOrders = filterOrdersByPeriod(selectedPeriod);
    const orderIds = filteredOrders.map((o) => o.id);

    const relevantItems = orderItems.filter((item) => orderIds.includes(item.order_id));

    const productStats: { [key: string]: { quantite: number; ca: number } } = {};

    relevantItems.forEach((item) => {
      if (!productStats[item.product_id]) {
        productStats[item.product_id] = { quantite: 0, ca: 0 };
      }
      productStats[item.product_id].quantite += item.quantite;
      productStats[item.product_id].ca += item.prix_unitaire * item.quantite;
    });

    const topProducts: TopProduct[] = Object.entries(productStats)
      .map(([productId, stats]) => {
        const product = products.find((p) => p.id === productId);
        return {
          nom: product?.nom || 'Produit supprimé',
          quantite: stats.quantite,
          ca: stats.ca,
        };
      })
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 10);

    return topProducts;
  };

  const getOpeningClosingHours = () => {
    const todayOrders = filterOrdersByPeriod('jour');
    if (todayOrders.length === 0) {
      return { opening: null, closing: null };
    }

    const times = todayOrders.map((order) => new Date(order.created_at));
    const opening = new Date(Math.min(...times.map((t) => t.getTime())));
    const closing = new Date(Math.max(...times.map((t) => t.getTime())));

    return { opening, closing };
  };

  const exportToCSV = () => {
    const filteredOrders = filterOrdersByPeriod(selectedPeriod);
    
    const csvData = filteredOrders.map((order) => ({
      Date: new Date(order.created_at).toLocaleString('fr-FR'),
      Buzzer: order.buzzer || 'N/A',
      Mode: order.mode === 'sur_place' ? 'Sur place' : 'À emporter',
      Paiement: order.paiement === 'especes' ? 'Espèces' : 'Carte',
      Total: order.total.toFixed(2) + ' €',
      Statut: order.statut === 'en_cours' ? 'En cours' : order.statut === 'termine' ? 'Terminé' : 'Annulé',
    }));

    const headers = ['Date', 'Buzzer', 'Mode', 'Paiement', 'Total', 'Statut'];
    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const filteredOrders = filterOrdersByPeriod(selectedPeriod);
    
    const excelData = filteredOrders.map((order) => ({
      Date: new Date(order.created_at).toLocaleString('fr-FR'),
      Buzzer: order.buzzer || 'N/A',
      Mode: order.mode === 'sur_place' ? 'Sur place' : 'À emporter',
      Paiement: order.paiement === 'especes' ? 'Espèces' : 'Carte',
      Total: order.total.toFixed(2),
      Statut: order.statut === 'en_cours' ? 'En cours' : order.statut === 'termine' ? 'Terminé' : 'Annulé',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commandes');
    XLSX.writeFile(workbook, `commandes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const filteredOrders = filterOrdersByPeriod(selectedPeriod);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Rapport des Commandes', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Période: ${getPeriodLabel()}`, 14, 32);
    doc.text(`Date d&apos;export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 38);

    const tableData = filteredOrders.map((order) => [
      new Date(order.created_at).toLocaleString('fr-FR'),
      order.buzzer || 'N/A',
      order.mode === 'sur_place' ? 'Sur place' : 'À emporter',
      order.paiement === 'especes' ? 'Espèces' : 'Carte',
      order.total.toFixed(2) + ' €',
      order.statut === 'en_cours' ? 'En cours' : order.statut === 'termine' ? 'Terminé' : 'Annulé',
    ]);

    autoTable(doc, {
      head: [['Date', 'Buzzer', 'Mode', 'Paiement', 'Total', 'Statut']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.text(`Total des ventes: ${calculateSales(selectedPeriod).toFixed(2)} €`, 14, finalY + 10);
    doc.text(`Espèces: ${calculatePaymentSales(selectedPeriod, 'especes').toFixed(2)} €`, 14, finalY + 18);
    doc.text(`Carte: ${calculatePaymentSales(selectedPeriod, 'carte').toFixed(2)} €`, 14, finalY + 26);

    doc.save(`commandes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'jour':
        return 'Aujourd\'hui';
      case 'semaine':
        return 'Cette semaine';
      case 'mois':
        return 'Ce mois';
      case 'personnalise':
        return `Du ${customStartDate} au ${customEndDate}`;
      default:
        return '';
    }
  };

  const salesDay = calculateSales('jour');
  const salesWeek = calculateSales('semaine');
  const salesMonth = calculateSales('mois');
  const salesCash = calculatePaymentSales(selectedPeriod, 'especes');
  const salesCard = calculatePaymentSales(selectedPeriod, 'carte');
  const dailySalesData = getDailySalesData();
  const topProducts = getTopProducts();
  const { opening, closing } = getOpeningClosingHours();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Période sélectionnée : {getPeriodLabel()}</p>
          </div>
          <div className="flex gap-3 items-center">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as Period)}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-2xl font-semibold focus:border-primary-500 focus:outline-none"
            >
              <option value="jour">Aujourd&apos;hui</option>
              <option value="semaine">Cette semaine</option>
              <option value="mois">Ce mois</option>
              <option value="personnalise">Période personnalisée</option>
            </select>
            {selectedPeriod === 'personnalise' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-300 rounded-2xl focus:border-primary-500 focus:outline-none"
                />
                <span className="text-gray-500 font-semibold">→</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-300 rounded-2xl focus:border-primary-500 focus:outline-none"
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-2xl transition-all flex items-center gap-2"
                title="Exporter en CSV"
              >
                📄 CSV
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-2xl transition-all flex items-center gap-2"
                title="Exporter en Excel"
              >
                📊 Excel
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all flex items-center gap-2"
                title="Exporter en PDF"
              >
                📑 PDF
              </button>
            </div>
            <button
              onClick={() => (window.location.href = '/commande')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-2xl transition-all"
            >
              ← Retour
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : (
          <>
            {/* Horaires d&apos;ouverture/fermeture */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-md p-6 mb-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold mb-2">🕐 Horaires de la caisse aujourd&apos;hui</h2>
                  {opening && closing ? (
                    <div className="flex gap-8 text-sm">
                      <div>
                        <span className="opacity-90">Ouverture : </span>
                        <span className="font-bold text-lg">
                          {opening.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="opacity-90">Fermeture : </span>
                        <span className="font-bold text-lg">
                          {closing.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm opacity-90">Aucune commande enregistrée aujourd&apos;hui</p>
                  )}
                </div>
                <div className="text-5xl">⏰</div>
              </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-primary-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold">Ventes du jour</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{salesDay.toFixed(2)} €</p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold">Ventes de la semaine</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{salesWeek.toFixed(2)} €</p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold">Ventes du mois</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{salesMonth.toFixed(2)} €</p>
                  </div>
                  <div className="text-4xl">📈</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold">Période sélectionnée</p>
                    <p className="text-lg font-bold text-gray-800 mt-2">
                      Espèces: {salesCash.toFixed(2)} €
                    </p>
                    <p className="text-lg font-bold text-gray-800">Carte: {salesCard.toFixed(2)} €</p>
                  </div>
                  <div className="text-4xl">💳</div>
                </div>
              </div>
            </div>

            {/* Graphique d&apos;évolution */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Évolution des ventes ({selectedPeriod === 'semaine' ? '7 derniers jours' : '30 derniers jours'})
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => `${Number(value).toFixed(2)} €`}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="montant"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Ventes (€)"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top produits */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Top 10 produits les plus vendus
              </h2>
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune vente sur cette période</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Rang
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Produit
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Quantité vendue
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          Chiffre d&apos;affaires
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {topProducts.map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                index === 0
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : index === 1
                                  ? 'bg-gray-100 text-gray-700'
                                  : index === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-primary-50 text-primary-600'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {product.nom}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{product.quantite}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {product.ca.toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


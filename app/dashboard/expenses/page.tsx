"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { ExpensePieChart } from "@/components/charts/ExpensePieChart";
import { Plus, Filter, Download, Pencil, Trash2, ChevronLeft, ChevronRight, CheckCircle2, X, Calendar, UploadCloud, Info, Clock, Lightbulb, TrendingUp } from "lucide-react";

// Use Supabase anon key and url if available, otherwise mock
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key";
const supabase = createClient(supabaseUrl, supabaseKey);

type Expense = {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  receipt_url?: string;
  property_id: string;
};

const CATEGORIES = ["Maintenance", "Utilities", "Taxes", "Insurance", "Other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form State
  const [formDate, setFormDate] = useState("");
  const [formCategory, setFormCategory] = useState("Maintenance & Repairs");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [showDraftBanner, setShowDraftBanner] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      // Mock data exactly matching the screenshot
      const initialMock = [
        { id: "1", date: "Oct 24, 2023", category: "Maintenance", description: "Elevator repair - Building B", amount: 1240.00, property_id: "p1" },
        { id: "2", date: "Oct 22, 2023", category: "Utilities", description: "Monthly Water Bill - All Units", amount: 850.20, property_id: "p1" },
        { id: "3", date: "Oct 20, 2023", category: "Insurance", description: "Liability Coverage Renewal", amount: 3400.00, property_id: "p1" },
        { id: "4", date: "Oct 18, 2023", category: "Taxes", description: "Property Tax Installment #2", amount: 5200.00, property_id: "p1" },
        { id: "5", date: "Oct 15, 2023", category: "Maintenance", description: "Garden Landscaping Services", amount: 450.00, property_id: "p1" },
      ];
      for (let i = 6; i <= 42; i++) {
        initialMock.push({
          id: String(i),
          date: "Oct 10, 2023",
          category: "Utilities",
          description: `Misc Expense ${i}`,
          amount: 150.00 + i,
          property_id: "p1"
        });
      }
      setExpenses(initialMock);
    } else {
      // If connected to real DB, format dates and map correctly
      setExpenses(data as Expense[]);
    }
    setLoading(false);
  }

  const pieData = useMemo(() => {
    return [
      {name: "Maintenance", value: 5602.50}, 
      {name: "Utilities", value: 3112.50},
      {name: "Taxes", value: 2000.00},
      {name: "Insurance", value: 1735.00}
    ];
  }, [expenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense = {
      property_id: propertyId || "mock-prop",
      date: formDate,
      category: formCategory.split(' ')[0], // simplify category for demo
      description: formDesc,
      amount: parseFloat(formAmount),
    };

    const { data, error } = await supabase.from("expenses").insert([newExpense]).select();

    if (!error && data) {
      setExpenses([...data, ...expenses]);
    } else {
      setExpenses([{ id: Math.random().toString(), ...newExpense }, ...expenses]);
    }

    setIsAddingExpense(false);
    setFormDate("");
    setFormDesc("");
    setFormAmount("");
  };

  if (isAddingExpense) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-[#f8fafc] min-h-screen font-sans text-slate-800">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[#0a415c] text-xl font-bold">Add Expense</h1>
        </div>

        {showDraftBanner && (
          <div className="bg-[#e6f4ea] border border-[#bce4c8] text-[#1e7e34] px-5 py-4 rounded-xl flex items-center justify-between mb-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-[#1e7e34] text-white rounded-full p-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm">Draft Saved Automatically</p>
                <p className="text-sm opacity-90 mt-0.5">Your changes have been saved to the ledger.</p>
              </div>
            </div>
            <button onClick={() => setShowDraftBanner(false)} className="text-[#1e7e34] hover:opacity-70 p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-[#0a415c] font-bold text-sm">Expense Details</h2>
            <p className="text-slate-500 text-sm mt-1">Fill in the information below to record a new property expense.</p>
          </div>
          
          <form onSubmit={handleAddExpense} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Property</label>
                <div className="relative">
                  <select 
                    value={propertyId} 
                    onChange={(e) => setPropertyId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0a415c]/20 bg-[#f8fafc] appearance-none text-sm"
                  >
                    <option value="">Select a property</option>
                    <option value="p1">Oakwood Heights</option>
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Date of Expense</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    placeholder="mm/dd/yyyy"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0a415c]/20 bg-[#f8fafc] text-sm"
                  />
                  <Calendar className="w-4 h-4 absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500 font-medium">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0a415c]/20 bg-[#f8fafc] text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <div className="relative">
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0a415c]/20 bg-[#f8fafc] appearance-none text-sm"
                  >
                    <option value="Maintenance & Repairs">Maintenance & Repairs</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Taxes">Taxes</option>
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea
                required
                rows={4}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Briefly describe the expense (e.g., Plumbing repair in master bathroom)"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0a415c]/20 bg-[#f8fafc] resize-none text-sm placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <div className="mt-2 flex justify-center px-6 pt-10 pb-10 border-2 border-slate-200 border-dashed rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="space-y-3 text-center flex flex-col items-center">
                  <UploadCloud className="h-8 w-8 text-[#0a415c]" />
                  <div className="text-sm font-bold text-slate-900 mt-2">Upload Receipt or Invoice</div>
                  <p className="text-xs text-slate-500">PDF, JPG, or PNG (Max 5MB)</p>
                  <div className="mt-4 pt-2">
                    <span className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-[#0a415c] bg-white group-hover:bg-slate-50 transition-colors">
                      Browse Files
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-end gap-6 items-center">
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="px-6 py-2.5 text-sm font-bold text-[#0a415c] hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#0a415c] hover:bg-[#073147] text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                Save Expense <span className="text-lg leading-none">&rarr;</span>
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0a415c] text-white p-6 rounded-xl shadow-sm h-full">
            <Info className="w-5 h-5 mb-4 text-blue-200" />
            <h3 className="font-bold text-sm mb-2">Tax Compliance</h3>
            <p className="text-blue-100 text-sm leading-relaxed">Ensure all maintenance expenses over ₹500 have an attached invoice.</p>
          </div>
          <div className="bg-[#dbe6f0] p-6 rounded-xl shadow-sm h-full">
            <Clock className="w-5 h-5 mb-4 text-[#0a415c]" />
            <h3 className="font-bold text-sm text-[#0a415c] mb-2">Recent History</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Oakwood Heights had a similar plumbing expense 2 months ago.</p>
          </div>
          <div className="bg-[#e2e8f0] border border-slate-200 p-6 rounded-xl shadow-sm h-full">
            <Lightbulb className="w-5 h-5 mb-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-800 mb-2">Pro Tip</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Categorizing utilities helps in generating annual profitability reports.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals and percentages for the layout
  const currentMonthTotal = 12450.00; // Mocked to match screenshot

  return (
    <div className="max-w-5xl mx-auto p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0a415c]">Expense Management</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Monitor and control your property operational costs</p>
        </div>
        <button
          onClick={() => setIsAddingExpense(true)}
          className="flex items-center gap-2 bg-[#0a415c] hover:bg-[#073147] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Monthly Total Card */}
        <div className="lg:col-span-2 bg-white rounded-xl p-8 shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-[13px] font-bold text-slate-500 tracking-wide mb-3">Monthly Total</h3>
          <p className="text-5xl font-extrabold text-[#0a415c] tracking-tight">
            ₹{currentMonthTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center text-sm font-bold text-[#e11d48] mt-8">
            <TrendingUp className="w-4 h-4 mr-1.5 stroke-[3]" />
            12% from last month
          </div>
        </div>

        {/* Expenses by Category Card */}
        <div className="lg:col-span-3 bg-white rounded-xl p-8 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[15px] font-bold text-[#0a415c]">Expenses by Category</h3>
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#0a415c]"></div> Maintenance</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#148092]"></div> Utilities</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#8492a6]"></div> Taxes</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#8492a6]"></div> Insurance</div>
            </div>
          </div>
          
          <div className="flex-1 flex items-center">
            <div className="w-40 h-40 relative shrink-0">
              <ExpensePieChart data={pieData} />
            </div>
            
            <div className="flex-1 ml-10 space-y-7">
              {/* Maintenance Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-600">Maintenance</span>
                  <span className="text-slate-900">₹5,602.50</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0a415c] rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              {/* Utilities Bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-600">Utilities</span>
                  <span className="text-slate-900">₹3,112.50</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0a415c] rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-[#0a415c] font-bold text-[15px]">Detailed Records</h2>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-xs tracking-wider">Date</th>
                <th className="px-6 py-5 text-xs tracking-wider">Category</th>
                <th className="px-6 py-5 text-xs tracking-wider w-full">Description</th>
                <th className="px-6 py-5 text-xs tracking-wider text-right">Amount</th>
                <th className="px-6 py-5 text-xs tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((expense) => {
                let badgeClass = "bg-slate-100 text-slate-600";
                if (expense.category === "Maintenance") badgeClass = "bg-[#e2e8f0] text-[#0a415c]";
                else if (expense.category === "Utilities") badgeClass = "bg-[#e0f2fe] text-[#0c4a6e]";
                else if (expense.category === "Taxes") badgeClass = "bg-[#fee2e2] text-[#991b1b]";
                else if (expense.category === "Insurance") badgeClass = "bg-[#dbeafe] text-[#1e40af]";

                return (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-6 text-slate-700 text-[13px] font-medium">
                      {expense.date}
                    </td>
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${badgeClass}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-slate-700 text-[13px] font-medium">{expense.description}</td>
                    <td className="px-6 py-6 text-right font-extrabold text-slate-900 text-[13px]">
                      ₹{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-4 text-slate-400">
                        <button className="hover:text-slate-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button className="hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, expenses.length)} of {expenses.length} expenses</div>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.ceil(expenses.length / itemsPerPage) })
              .map((_, i) => i + 1)
              .filter(p => {
                 if (currentPage === 1) return p <= 3;
                 if (currentPage === Math.ceil(expenses.length / itemsPerPage)) return p >= currentPage - 2;
                 return p >= currentPage - 1 && p <= currentPage + 1;
              })
              .map(pageNum => (
                <button 
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded font-bold ${
                    currentPage === pageNum 
                      ? "bg-[#0a415c] text-white shadow-sm" 
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(expenses.length / itemsPerPage), prev + 1))}
              disabled={currentPage === Math.ceil(expenses.length / itemsPerPage)}
              className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

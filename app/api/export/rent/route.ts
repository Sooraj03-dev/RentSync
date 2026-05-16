import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jsPDF from 'jspdf';

export async function GET(request: NextRequest) {
  const payment_id = request.nextUrl.searchParams.get('payment_id');
  if (!payment_id) return NextResponse.json({ error: 'payment_id required' }, { status: 400 });

  const supabase = createClient();
  const { data: payment } = await supabase
    .from('rent_payments')
    .select(`*, tenancies(unit_number, rent_amount, properties(name, address), profiles(name))`)
    .eq('id', payment_id)
    .single();

  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const t = payment.tenancies as any;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RENT RECEIPT', 20, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RentSync · Official Receipt', 20, 33);

  // Body
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);

  const lines: [string, string][] = [
    ['Tenant Name',   t?.profiles?.name ?? '—'],
    ['Unit',          t?.unit_number ?? '—'],
    ['Property',      t?.properties?.name ?? '—'],
    ['Address',       t?.properties?.address ?? '—'],
    ['Month / Year',  payment.month_year],
    ['Payment Date',  payment.payment_date],
    ['Amount Paid',   `₹${Number(payment.amount_paid).toLocaleString('en-IN')}`],
    ['Status',        (payment.status as string).toUpperCase()],
  ];

  let y = 60;
  lines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 90, y);
    y += 10;
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('This is a computer-generated receipt. No signature required.', 20, 270);
  doc.text('RentSync · rentsync.app', 20, 276);

  const pdfBytes = doc.output('arraybuffer');

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${payment.month_year}.pdf"`,
    },
  });
}

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertGroup(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertGroup(n % 100) : '');
}

export function numberToWords(amount: number, currencyName = 'Rupees'): string {
  if (amount === 0) return `Zero ${currencyName} Only`;
  
  const intPart = Math.floor(Math.abs(amount));
  const decPart = Math.round((Math.abs(amount) - intPart) * 100);
  
  // Indian numbering: lakhs, crores
  const crore = Math.floor(intPart / 10000000);
  const lakh = Math.floor((intPart % 10000000) / 100000);
  const thousand = Math.floor((intPart % 100000) / 1000);
  const rest = intPart % 1000;
  
  let result = '';
  if (crore) result += convertGroup(crore) + ' Crore ';
  if (lakh) result += convertGroup(lakh) + ' Lakh ';
  if (thousand) result += convertGroup(thousand) + ' Thousand ';
  if (rest) result += convertGroup(rest);
  
  result = result.trim() + ` ${currencyName}`;
  if (decPart > 0) result += ' and ' + convertGroup(decPart) + ' Paise';
  
  return result.trim() + ' Only';
}

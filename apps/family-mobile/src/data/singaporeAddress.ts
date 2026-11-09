// 本地预览使用的示例地址。
export const sampleAddresses = {
  redhill: { street: '12 Bukit Merah View', unit: '#03-302', postal: '150012' },
  toaPayoh: { street: '85 Lorong 4 Toa Payoh', unit: '#08-105', postal: '310085' },
  child: { street: '88 Orchard Road', unit: '#05-102', postal: '238841' },
  queenstown: { street: '46 Commonwealth Drive', unit: '#04-108', postal: '140046' }
};

export function formatAddress(address: { street: string; unit: string; postal: string; building?: string }, masked = false) {
  if (masked) return [address.street, '#**-***', 'Singapore ' + address.postal.slice(0, 2) + '****'].join(' · ');
  return [address.street, [address.unit, address.building].filter(Boolean).join(' '), 'Singapore ' + address.postal].join('\n');
}

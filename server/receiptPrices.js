// Only exact receipt names can supply prices to the suggested shopping list.
// A recommendation without a matching receipt line has no known price.
export function useReceiptPrices(analysis) {
  const keep = analysis.nextWeek.keep.map(item => {
    const matches = analysis.products.filter(product => product.name === item.name);
    return { ...item, price: matches.length === 1 ? matches[0].price : null, source: matches.length === 1 ? 'receipt' : null };
  });
  const add = analysis.nextWeek.add.map(item => ({ ...item, price: null, source: null }));
  const items = [...keep, ...add];
  const complete = items.length > 0 && items.every(item => Number.isFinite(item.price));
  return {
    ...analysis,
    topEliminate: analysis.topEliminate.map(item => ({ ...item, alternativePrice: null, alternativeSource: null })),
    nextWeek: {
      keep, add,
      estimatedTotal: complete ? Math.round(items.reduce((sum, item) => sum + item.price, 0) * 100) / 100 : null,
      pricesVerifiedAt: '',
    },
  };
}

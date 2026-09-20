const mockResponse = { estimated_yield: 82.4, water_consumption: 520, total_cost: 82400, revenue: 164000, profit: 82000, risk_score: 32, risk_level: 'Medium', explanation: 'Water availability is below the modeled requirement for the selected crop.' };

export async function simulateScenario(inputs) {
  void inputs;
  return { ...mockResponse };
}

// INTEGRATION TEST RUNNER
// Executes comprehensive integration tests for the entire trading system

import ComprehensiveIntegrationTest from './comprehensive-integration-test';

/**
 * Run all integration tests
 */
async function runAllIntegrationTests(): Promise<void> {
  console.log('🚀 STARTING COMPREHENSIVE INTEGRATION TESTING SUITE...');
  console.log('=' .repeat(60));

  const testSuites = [
    {
      name: 'Basic Integration Test',
      config: {
        testDurationMs: 2 * 60 * 1000, // 2 minutes
        numberOfAccounts: 3,
        strategiesToTest: ['whale_tracking', 'arbitrage', 'momentum_transfer', 'flash_loan'],
        enableLoadTesting: false,
        simulateExtremeEvents: false
      }
    },
    {
      name: 'Load Testing Suite',
      config: {
        testDurationMs: 3 * 60 * 1000, // 3 minutes
        numberOfAccounts: 5,
        strategiesToTest: ['whale_tracking', 'arbitrage', 'liquidation_cascade', 'momentum_transfer', 'regulatory_frontrun', 'flash_loan'],
        enableLoadTesting: true,
        maxConcurrentOperations: 200,
        simulateExtremeEvents: false
      }
    },
    {
      name: 'Risk Management Test',
      config: {
        testDurationMs: 2 * 60 * 1000, // 2 minutes
        numberOfAccounts: 4,
        strategiesToTest: ['whale_tracking', 'liquidation_cascade', 'stablecoin_depeg', 'funding_rate'],
        testRiskLimits: true,
        simulateExtremeEvents: true,
        enableLoadTesting: false
      }
    },
    {
      name: 'Full System Integration Test',
      config: {
        testDurationMs: 5 * 60 * 1000, // 5 minutes
        numberOfAccounts: 5,
        strategiesToTest: [
          'whale_tracking', 'arbitrage', 'liquidation_cascade', 'momentum_transfer',
          'regulatory_frontrun', 'flash_loan', 'meme_coin', 'stablecoin_depeg',
          'funding_rate', 'time_zone', 'maintenance', 'insider_activity'
        ],
        enableLoadTesting: true,
        maxConcurrentOperations: 150,
        testRiskLimits: true,
        simulateExtremeEvents: true
      }
    }
  ];

  const results: Array<{ name: string; success: boolean; report: string }> = [];

  for (const testSuite of testSuites) {
    console.log(`\n🧪 RUNNING: ${testSuite.name.toUpperCase()}`);
    console.log('-'.repeat(50));

    try {
      const integrationTest = new ComprehensiveIntegrationTest(testSuite.config);
      const result = await integrationTest.runIntegrationTest();
      
      const report = integrationTest.generateTestReport();
      console.log(report);

      results.push({
        name: testSuite.name,
        success: result.success,
        report
      });

      if (result.success) {
        console.log(`✅ ${testSuite.name} PASSED`);
      } else {
        console.log(`❌ ${testSuite.name} FAILED`);
        console.log('Errors:', result.errors);
      }

    } catch (error) {
      console.error(`❌ ${testSuite.name} CRASHED:`, error);
      results.push({
        name: testSuite.name,
        success: false,
        report: `Test crashed: ${error}`
      });
    }
  }

  // Generate overall summary
  console.log('\n🏆 INTEGRATION TESTING SUMMARY');
  console.log('=' .repeat(60));

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  const overallSuccess = passedTests === totalTests;

  console.log(`Total Test Suites: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Overall Status: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  // Detailed results
  console.log('\n📋 DETAILED RESULTS:');
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.name}: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
  });

  // Export results
  const exportData = {
    timestamp: new Date().toISOString(),
    overallSuccess,
    passedTests,
    totalTests,
    successRate: (passedTests / totalTests) * 100,
    results: results.map(r => ({
      name: r.name,
      success: r.success,
      report: r.report
    }))
  };

  console.log('\n💾 Test results exported to JSON format');
  
  if (overallSuccess) {
    console.log('\n🎉 ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
    console.log('🚀 TRADING SYSTEM IS READY FOR UNLIMITED SCALING!');
  } else {
    console.log('\n⚠️ SOME INTEGRATION TESTS FAILED');
    console.log('🔧 PLEASE REVIEW AND FIX ISSUES BEFORE DEPLOYMENT');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllIntegrationTests()
    .then(() => {
      console.log('\n✅ Integration testing suite completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Integration testing suite failed:', error);
      process.exit(1);
    });
}

export { runAllIntegrationTests };
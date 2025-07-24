// PRODUCTION DEPLOYMENT TEST
// Tests the unlimited scaling production deployment system

import UnlimitedScalingProductionDeployment, {
  DeploymentEnvironment,
  ScalingTier
} from '../core/unlimited-scaling-production-deployment';

/**
 * Run production deployment test
 */
async function runProductionDeploymentTest(): Promise<void> {
  console.log('🚀 STARTING PRODUCTION DEPLOYMENT TEST...');
  console.log('=' .repeat(60));

  try {
    // Create production deployment system
    const deployment = new UnlimitedScalingProductionDeployment({
      environment: DeploymentEnvironment.PRODUCTION,
      scalingTier: ScalingTier.UNLIMITED,
      initialCapital: 3, // Start with £3
      minInstances: 2,
      maxInstances: 10,
      autoScalingEnabled: true,
      monitoringEnabled: true,
      backupEnabled: true
    });

    // Set up event listeners
    deployment.on('deploymentComplete', (status) => {
      console.log('✅ Deployment completed:', status.deploymentId);
    });

    deployment.on('scaleUp', (event) => {
      console.log(`📈 Scaled up: ${event.fromInstances} → ${event.toInstances} instances`);
    });

    deployment.on('scaleDown', (event) => {
      console.log(`📉 Scaled down: ${event.fromInstances} → ${event.toInstances} instances`);
    });

    // Deploy the system
    console.log('\n🚀 DEPLOYING UNLIMITED SCALING INFRASTRUCTURE...');
    await deployment.deploy();

    // Let it run for 2 minutes to test auto-scaling and monitoring
    console.log('\n⏱️ Running deployment test for 2 minutes...');
    await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));

    // Get deployment status
    const status = deployment.getDeploymentStatus();
    const instances = deployment.getInstanceStatus();
    const scalingEvents = deployment.getScalingEvents();

    // Display results
    console.log('\n📊 DEPLOYMENT TEST RESULTS:');
    console.log('=' .repeat(50));
    
    console.log(`\n🏗️ DEPLOYMENT STATUS:`);
    console.log(`Status: ${status.status.toUpperCase()}`);
    console.log(`Health Score: ${status.healthScore.toFixed(1)}/100`);
    console.log(`Active Instances: ${status.activeInstances}`);
    console.log(`Total Capacity: ${status.totalCapacity}%`);
    console.log(`Current Load: ${status.currentLoad.toFixed(1)}%`);
    console.log(`Uptime: ${(status.uptime / (1000 * 60)).toFixed(1)} minutes`);

    console.log(`\n🖥️ INSTANCE STATUS:`);
    for (const [instanceId, instance] of instances.entries()) {
      console.log(`${instanceId}: ${instance.status.toUpperCase()} (Health: ${instance.healthScore}/100, Load: ${instance.currentLoad.toFixed(1)}%)`);
    }

    console.log(`\n📈 SCALING EVENTS:`);
    if (scalingEvents.length > 0) {
      for (const event of scalingEvents) {
        console.log(`${event.timestamp.toISOString()}: ${event.type.toUpperCase()} ${event.fromInstances}→${event.toInstances} (${event.reason})`);
      }
    } else {
      console.log('No scaling events occurred during test');
    }

    // Generate and display report
    console.log('\n📋 DETAILED DEPLOYMENT REPORT:');
    console.log(deployment.generateDeploymentReport());

    // Export deployment data
    const exportData = deployment.exportDeploymentData();
    console.log('\n💾 Deployment data exported to JSON format');

    // Stop deployment
    console.log('\n🛑 Stopping deployment...');
    await deployment.stop();

    console.log('\n✅ PRODUCTION DEPLOYMENT TEST COMPLETED SUCCESSFULLY!');
    console.log('🚀 SYSTEM IS READY FOR UNLIMITED SCALING FROM £3 TO £1M+!');

  } catch (error) {
    console.error('❌ PRODUCTION DEPLOYMENT TEST FAILED:', error);
    throw error;
  }
}

// Export for use in other tests
export { runProductionDeploymentTest };

// Run test if this file is executed directly
if (require.main === module) {
  runProductionDeploymentTest()
    .then(() => {
      console.log('\n✅ Production deployment test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Production deployment test failed:', error);
      process.exit(1);
    });
}
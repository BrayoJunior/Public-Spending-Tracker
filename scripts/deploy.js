async function main() {
  const EduSpendingTracker = await ethers.getContractFactory("EduSpendingTracker");
  const tracker = await EduSpendingTracker.deploy();
  await tracker.waitForDeployment();
  console.log("EduSpendingTracker deployed to:", tracker.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
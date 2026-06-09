import { execSync } from 'child_process';

try {
  console.log("Restoring LoyaltyView.tsx using git...");
  execSync('git checkout -- src/views/LoyaltyView.tsx', { stdio: 'inherit' });
  console.log("File successfully restored!");
} catch (err) {
  console.error("Failed to restore file:", err);
}

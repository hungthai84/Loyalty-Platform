import fs from "fs";
import path from "path";

const files = [
  'src/components/loyalty/InteractiveRoadmapView.tsx',
  'src/components/loyalty/EarnRuleDialog.tsx',
  'src/components/loyalty/BespokeSimulator.tsx',
  'src/components/loyalty/GiftsManagementView.tsx',
  'src/components/loyalty/RetentionConfigDialog.tsx',
  'src/components/loyalty/StatusTransitionConfigView.tsx',
  'src/components/loyalty/TierConfigDialog.tsx',
  'src/components/loyalty/OfferAnalysis.tsx',
  'src/components/loyalty/TierManagementView.tsx',
  'src/components/loyalty/LoyaltySettingsView.tsx',
  'src/components/loyalty/PointRedemptionConfigView.tsx',
  'src/components/loyalty/SegmentationRuleDialog.tsx',
  'src/components/loyalty/LoyaltyCampaignDialog.tsx',
  'src/components/loyalty/RedemptionRuleDialog.tsx',
  'src/views/LoyaltyView.tsx'
];

files.forEach(file => {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/rounded-lg/g, 'rounded-[10px]');
    content = content.replace(/rounded-md/g, 'rounded-[10px]');
    fs.writeFileSync(filePath, content);
  }
});
console.log("Done");

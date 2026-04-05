function calculateNgoFraudScore(ngo) {
  let score = 0;
  const reasons = [];

  const requiredDocs = [
    "registrationCertificate",
    "panDocument",
    "auditReport",
    "taxClearance",
    "boardMemberVerification",
    "projectReport",
  ];

  const missingDocs = requiredDocs.filter(
    (doc) => !ngo.documents?.[doc]?.fileUrl
  );

  if (missingDocs.length > 0) {
    score += 30;
    reasons.push("Missing required verification documents");
  }

  if (!ngo.bankName || !ngo.accountNumber || !ngo.accountName) {
    score += 15;
    reasons.push("Incomplete bank details");
  }

  if (!ngo.website) {
    score += 5;
    reasons.push("No website provided");
  }

  if (!ngo.description || ngo.description.length < 50) {
    score += 10;
    reasons.push("Weak NGO profile information");
  }

  return { score, reasons };
}

function calculateProjectFraudScore(project, ngo) {
  let score = 0;
  const reasons = [];

  if (project.goalAmount > 500000 && ngo?.verificationStatus !== "approved") {
    score += 25;
    reasons.push("High funding goal before NGO approval");
  }

  if (!project.description || project.description.length < 80) {
    score += 10;
    reasons.push("Insufficient project description");
  }

  if (!project.endDate) {
    score += 10;
    reasons.push("Missing project deadline");
  }

  return { score, reasons };
}

module.exports = {
  calculateNgoFraudScore,
  calculateProjectFraudScore,
};
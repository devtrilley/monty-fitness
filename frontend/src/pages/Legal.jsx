import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Legal() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg">
      <div className="bg-surface border-b border-border px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted hover:text-text transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-bold text-text tracking-widest uppercase text-sm">
              Monty
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-text">
            Terms of Service & Privacy Policy
          </h1>
          <p className="text-muted text-sm mt-1">Last updated: March 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text border-b border-border pb-2">
            Terms of Service
          </h2>
          <div className="space-y-4 text-muted text-sm leading-relaxed">
            {[
              [
                "1. Acceptance of Terms",
                "By accessing or using Monty (the App), you agree to be bound by these Terms of Service. If you do not agree, please do not use the App.",
              ],
              [
                "2. Use of the App",
                "Monty is a fitness tracking tool for personal use. You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.",
              ],
              [
                "3. Health Disclaimer",
                "Monty is not a medical application. The content and features provided are for informational and tracking purposes only. Always consult a qualified healthcare professional before starting any new exercise program. We are not responsible for any injury or health complications arising from use of the App.",
              ],
              [
                "4. User Content",
                "You retain ownership of any workout data, routines, and content you create in the App. By using Monty, you grant us a limited license to store and process your data solely to provide the service.",
              ],
              [
                "5. Prohibited Conduct",
                "You agree not to misuse the App, attempt to gain unauthorized access to other accounts, use the App for any unlawful purpose, or reverse engineer any part of the service.",
              ],
              [
                "6. Termination",
                "We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion.",
              ],
              [
                "7. Changes to Terms",
                "We may update these terms from time to time. Continued use of the App after changes constitutes acceptance of the new terms.",
              ],
              [
                "8. Limitation of Liability",
                "To the fullest extent permitted by law, Monty and its developers are not liable for any indirect, incidental, or consequential damages arising from your use of the App.",
              ],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-medium text-text mb-1">{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text border-b border-border pb-2">
            Privacy Policy
          </h2>
          <div className="space-y-4 text-muted text-sm leading-relaxed">
            {[
              [
                "1. Information We Collect",
                "We collect information you provide directly: your name, email address, and workout data including exercises, sets, reps, and weights. We do not collect payment information.",
              ],
              [
                "2. How We Use Your Information",
                "Your data is used solely to provide and improve the Monty service — to display your workout history, calculate analytics, and personalize your experience. We do not sell your data to third parties.",
              ],
              [
                "3. Data Storage",
                "Your data is stored securely on our servers. We use industry-standard measures to protect your information, including encrypted token-based authentication.",
              ],
              [
                "4. Data Retention",
                "We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.",
              ],
              [
                "5. Cookies & Local Storage",
                "Monty uses browser local storage to maintain your login session. We do not use third-party tracking cookies or advertising cookies.",
              ],
              [
                "6. Third-Party Services",
                "We do not share personal information with third parties except as necessary to operate the service. Any third-party services we use are bound by their own privacy policies.",
              ],
              [
                "7. Your Rights",
                "You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at the email below.",
              ],
              [
                "8. Contact",
                "For any questions about these policies, please contact us at support@montyfit.app.",
              ],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-medium text-text mb-1">{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center text-muted text-xs pb-6">
          © {new Date().getFullYear()} Monty. All rights reserved.
        </div>
      </div>
    </div>
  );
}

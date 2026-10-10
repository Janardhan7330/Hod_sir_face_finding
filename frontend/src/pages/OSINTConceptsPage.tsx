import { Shield, Search, Globe, AlertCircle, CheckCircle, BookOpen, Users, Lock, Eye, WifiOff, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export function OSINTConceptsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">OSINT Concepts & Ethics</h1>
        <p className="text-muted-foreground">
          Understanding Open Source Intelligence and why this system does not perform facial OSINT
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>What This System Does NOT Do</CardTitle>
            </div>
            <CardDescription>Critical distinctions about system scope and capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { title: 'No Internet Face Search', desc: 'Does not query Google, Bing, social media, or any external databases for face matches' },
                { title: 'No Social Media Scraping', desc: 'Does not scrape Facebook, Instagram, LinkedIn, Twitter, or any platform for profile data' },
                { title: 'No Reverse Image Search', desc: 'Does not perform Google Images, TinEye, or Yandex reverse face searches' },
                { title: 'No Identity Resolution', desc: 'Does not attempt to discover real-world identities of unknown faces' },
                { title: 'No Attribute Inference', desc: 'Does not infer race, religion, politics, health, sexuality, or other sensitive attributes' },
                { title: 'No Covert Collection', desc: 'Does not secretly collect biometric data; all enrollment requires explicit consent' },
                { title: 'No Watchlist Matching', desc: 'Does not match against government, law enforcement, or commercial watchlists' },
                { title: 'No Cross-Reference', desc: 'Does not cross-reference faces across different contexts or data sources' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
                  <WifiOff className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-800">{item.title}</h4>
                    <p className="text-sm text-red-700 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <CardTitle>What is OSINT?</CardTitle>
            </div>
            <CardDescription>Open Source Intelligence fundamentals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose max-w-none">
              <p className="text-muted-foreground mb-4">
                <strong>OSINT (Open Source Intelligence)</strong> refers to the collection and analysis of information
                gathered from publicly available sources to produce actionable intelligence.
              </p>

              <h4 className="font-medium mb-2">Traditional OSINT Sources</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                <li>News media, academic publications, government reports</li>
                <li>Social media posts (public profiles only)</li>
                <li>Corporate websites, financial filings, patent databases</li>
                <li>Geospatial data, satellite imagery, maps</li>
                <li>Technical data: DNS records, SSL certificates, code repositories</li>
              </ul>

              <h4 className="font-medium mb-2">Facial OSINT: A Specialized Concern</h4>
              <p className="text-muted-foreground mb-4">
                Facial OSINT specifically refers to using facial recognition technology to search
                publicly available images (social media, news, websites) to identify individuals.
                This raises significant privacy, consent, and legal concerns.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h5 className="font-medium text-green-800">Ethical OSINT Practices</h5>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Respect robots.txt and terms of service</li>
                    <li>• Only access publicly available information</li>
                    <li>• Document methodology and sources</li>
                    <li>• Minimize personal data collection</li>
                    <li>• Comply with GDPR, CCPA, and local laws</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h5 className="font-medium text-red-800">Facial OSINT Risks</h5>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Violates reasonable expectation of privacy</li>
                    <li>• Enables stalking, harassment, doxxing</li>
                    <li>• Bypasses consent for biometric processing</li>
                    <li>• Often illegal under GDPR (biometric = special category)</li>
                    <li>• Disproportionate impact on vulnerable groups</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              <CardTitle>Legal & Ethical Framework</CardTitle>
            </div>
            <CardDescription>Regulations governing biometric data and facial recognition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { regulation: 'GDPR (EU)', keyPoints: ['Biometric data = special category data (Art. 9)', 'Explicit consent required for processing', 'Right to erasure (Art. 17)', 'DPIA required for large-scale processing', 'Fines up to €20M or 4% global revenue'] },
                { regulation: 'CCPA/CPRA (California)', keyPoints: ['Biometric = sensitive personal information', 'Right to know, delete, opt-out', 'Private right of action for breaches', 'Consent required for sale/sharing'] },
                { regulation: 'BIPA (Illinois)', keyPoints: ['Written consent required before collection', 'Retention schedule + destruction policy', 'Private right of action ($1K-$5K/violation)', 'No profit from biometric data'] },
                { regulation: 'LGPD (Brazil)', keyPoints: ['Biometric = sensitive data', 'Specific consent required', 'Data subject rights', 'ANPD enforcement'] },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">{item.regulation}</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {item.keyPoints.map((point, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle>Why Consent-Based Recognition?</CardTitle>
            </div>
            <CardDescription>The ethical alternative to facial OSINT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: UserCheck, title: 'Explicit Opt-In', desc: 'Every participant knowingly enrolls and consents to recognition' },
                { icon: Eye, title: 'Transparent Purpose', desc: 'Clear scope: group photo recognition for authorized participants only' },
                { icon: Lock, title: 'Data Control', desc: 'Participants can view, export, or delete their data anytime' },
                { icon: Shield, title: 'Audit Trail', desc: 'All recognition events logged with timestamps and operators' },
                { icon: Search, title: 'No Scope Creep', desc: 'System cannot be repurposed for surveillance or OSINT without code changes' },
                { icon: Globe, title: 'Offline-First', desc: 'No external API calls; all processing local to your infrastructure' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg border">
                  <item.icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsible Use Guidelines</CardTitle>
            <CardDescription>For developers and operators of face recognition systems</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
              <li><strong>Define clear, limited purpose</strong> — Document exactly what the system will and won't do</li>
              <li><strong>Obtain informed consent</strong> — Participants must understand what data is collected and how it's used</li>
              <li><strong>Implement access controls</strong> — Role-based access with principle of least privilege</li>
              <li><strong>Enable data subject rights</strong> — Easy access, correction, deletion, and portability</li>
              <li><strong>Conduct DPIA</strong> — Data Protection Impact Assessment before deployment</li>
              <li><strong>Regular audits</strong> — Review access logs, accuracy metrics, and bias testing</li>
              <li><strong>Plan for decommissioning</strong> — Data deletion procedures when system is retired</li>
              <li><strong>Train operators</strong> — Ensure operators understand limitations and ethical boundaries</li>
              <li><strong>Document everything</strong> — Architecture, data flows, retention policies, incident response</li>
              <li><strong>Engage stakeholders</strong> — Include affected communities in design and oversight</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <BookOpen className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Further Reading</h3>
                <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                  <li>• <a href="https://gdpr.eu/article-9/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GDPR Article 9: Special Categories of Personal Data</a></li>
                  <li>• <a href="https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3014&ChapterID=57" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Illinois BIPA (Biometric Information Privacy Act)</a></li>
                  <li>• <a href="https://www.nist.gov/programs-projects/face-recognition-vendor-test-frvt" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">NIST Face Recognition Vendor Test (FRVT)</a></li>
                  <li>• <a href="https://www.iso.org/standard/74438.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ISO/IEC 30107: Biometric Presentation Attack Detection</a></li>
                  <li>• <a href="https://ai.google/responsible/ai-principles/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Principles: Responsible AI Practices</a></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
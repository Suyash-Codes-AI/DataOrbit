export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  metadata: {
    section?: string;
    category?: string;
    effectiveDate?: string;
    region?: string;
  };
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  uploadDate: string;
  sizeBytes: number;
  chunksCount: number;
  status: 'indexed' | 'processing' | 'error';
  category: string;
  summary: string;
  rawText: string;
}

export interface RetrievalResult {
  chunkId: string;
  documentTitle: string;
  snippet: string;
  score: number; // 0 to 1
  section?: string;
  citation: string;
}

// In-memory Document Store
class DocumentStore {
  private documents: Map<string, DocumentItem> = new Map();
  private chunks: DocumentChunk[] = [];
  private initialized = false;

  constructor() {
    this.seedDefaultDocuments();
  }

  public getAllDocuments(): DocumentItem[] {
    return Array.from(this.documents.values());
  }

  public getDocument(id: string): DocumentItem | undefined {
    return this.documents.get(id);
  }

  public getChunksForDocument(docId: string): DocumentChunk[] {
    return this.chunks.filter(c => c.documentId === docId);
  }

  public addDocument(
    title: string,
    filename: string,
    rawText: string,
    category: string = 'General Business'
  ): DocumentItem {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const chunks = this.createChunks(id, title, rawText, category);
    this.chunks.push(...chunks);

    const doc: DocumentItem = {
      id,
      title,
      filename,
      uploadDate: new Date().toISOString().split('T')[0],
      sizeBytes: Buffer.byteLength(rawText, 'utf8'),
      chunksCount: chunks.length,
      status: 'indexed',
      category,
      summary: rawText.substring(0, 180).replace(/\n/g, ' ') + '...',
      rawText
    };

    this.documents.set(id, doc);
    return doc;
  }

  public retrieveRelevantChunks(query: string, limit: number = 4): RetrievalResult[] {
    if (!query || this.chunks.length === 0) return [];

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const scored = this.chunks.map(chunk => {
      const chunkTokens = this.tokenize(chunk.content + ' ' + (chunk.metadata.section || ''));
      let matchCount = 0;
      let phraseBonus = 0;

      // Exact phrase match bonus
      if (chunk.content.toLowerCase().includes(query.toLowerCase())) {
        phraseBonus = 0.4;
      }

      // Token overlap with IDF weighting
      const chunkTokenSet = new Set(chunkTokens);
      for (const t of queryTokens) {
        if (chunkTokenSet.has(t)) {
          // Rare / specific words get higher weight
          const weight = (t.length > 5 || /delhi|mumbai|q3|inventory|policy|decline|warehouse|monsoon/i.test(t)) ? 2.5 : 1.0;
          matchCount += weight;
        }
      }

      const rawScore = (matchCount / Math.max(queryTokens.length, 1)) * 0.6 + phraseBonus;
      const normalizedScore = Math.min(0.99, Math.round(rawScore * 100) / 100);

      return {
        chunkId: chunk.id,
        documentTitle: chunk.documentTitle,
        snippet: chunk.content.trim(),
        score: normalizedScore,
        section: chunk.metadata.section,
        citation: `${chunk.documentTitle} (§ ${chunk.metadata.section || `Chunk ${chunk.chunkIndex + 1}`})`
      };
    });

    return scored
      .filter(s => s.score > 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private tokenize(text: string): string[] {
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'by']);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !stopWords.has(t));
  }

  private createChunks(
    docId: string,
    title: string,
    rawText: string,
    category: string
  ): DocumentChunk[] {
    // Split by markdown headings or paragraphs
    const paragraphs = rawText.split(/\n(?=#{1,3}\s)/);
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Extract section title if starts with #
      let sectionName = `Section ${chunkIndex + 1}`;
      const headingMatch = trimmed.match(/^#{1,3}\s+(.+?)(?:\n|$)/);
      if (headingMatch) {
        sectionName = headingMatch[1].trim();
      }

      // If paragraph is too long (> 800 chars), split into sub-blocks
      if (trimmed.length > 800) {
        const subBlocks = trimmed.match(/.{1,700}(?:\s|$)/g) || [trimmed];
        for (let s = 0; s < subBlocks.length; s++) {
          chunks.push({
            id: `${docId}_c${chunkIndex++}`,
            documentId: docId,
            documentTitle: title,
            chunkIndex,
            content: subBlocks[s].trim(),
            metadata: {
              section: `${sectionName} (Part ${s + 1})`,
              category
            }
          });
        }
      } else {
        chunks.push({
          id: `${docId}_c${chunkIndex++}`,
          documentId: docId,
          documentTitle: title,
          chunkIndex,
          content: trimmed,
          metadata: {
            section: sectionName,
            category
          }
        });
      }
    }

    return chunks;
  }

  private seedDefaultDocuments() {
    if (this.initialized) return;
    this.initialized = true;

    // Document 1: Corporate Inventory Policy & Monsoon Protocol
    this.addDocument(
      'Corporate Inventory Allocation & Regional Fulfillment Policy (2025)',
      'corporate_inventory_policy_2025.md',
      `# Corporate Inventory Allocation & Fulfillment Policy
Effective Date: January 1, 2025
Audience: Logistics, Operations, Regional Sales Managers

## 1. Regional Hub Distribution Guidelines
All enterprise hardware and IoT telemetry devices are stored across three primary tier-1 distribution centers:
1. North Hub: Okhla Phase III & Kundli Depot (Delhi NCR)
2. West Hub: Bhiwandi Logistics Park (Mumbai MMR)
3. South Hub: Electronic City Logistics Facility (Bangalore)

## 2. Monsoon Maintenance Protocol & Delhi Warehouse Restriction (Q3 2025)
During the Q3 2025 monsoon season (effective July 15, 2025 through September 30, 2025), the North Hub (Delhi NCR) underwent mandatory structural drainage reinforcement and roof waterproofing. 
Under Executive Order EO-2025-07B:
- Inbound container clearance was throttled by 60%.
- Outbound shipments to Delhi, Noida, and Gurgaon corporate accounts were restricted to priority medical contracts only.
- Commercial deliveries experienced an average fulfillment delay of 22 business days.
- Over 35% of booked enterprise hardware and cloud server orders in Delhi were cancelled or deferred into Q4 2025.
- Normal inventory throughput and stock replenishment in Delhi was fully restored on October 5, 2025.

## 3. Stockout Penalties and SLA Waivers
Due to force majeure weather and facility retrofit declarations, all standard SLA penalty claims for delayed orders in Delhi NCR during Q3 2025 are waived under Section 14.2 of corporate master service agreements.`,
      'Logistics & Operations'
    );

    // Document 2: Regional Sales Strategy 2025-2026
    this.addDocument(
      'Commercial Sales Strategy & Territorial Incentives (2025-2026)',
      'regional_sales_strategy_2025_2026.md',
      `# Commercial Sales Strategy & Territorial Targets
Period: FY2025 - FY2026
Author: VP of Global Sales & Revenue Operations

## 1. Mumbai Western Corridor Expansion Initiative
Beginning June 2025, our enterprise team initiated an aggressive enterprise push across Mumbai's financial services and fintech corridor (BKC and Nariman Point).
- Incentive: 12% to 15% upfront promotional discounts on multi-year Cloud HyperCluster and Enterprise AI Suite contracts.
- Result: Mumbai registered month-over-month growth of +14% throughout Q2 and Q3 2025, significantly outpacing Northern territories.
- Account Retention: Client contract renewal rate in Mumbai reached 94.2%.

## 2. Delhi Regional Sales Challenges
Northern India territory (Delhi NCR) missed its Q3 2025 revenue quota by approximately 31%. While gross pipeline demand remained robust, the warehouse throughput freeze (Okhla depot maintenance) prevented sales representatives from closing delivery-dependent purchases. Representatives were instructed to route prospective clients to SaaS-only offerings (Streamline ERP and CyberShield).

## 3. Bangalore Tech Sector Momentum
Bangalore maintained the highest gross profit margin (averaging 58.4%) across all quarters, driven by heavy adoption of Neural Accelerator Pods and DataMesh Analytics by venture-backed technology startups.`,
      'Sales Strategy'
    );

    // Document 3: Product Lifecycle and Deprecation Notice
    this.addDocument(
      'Product Lifecycle Roadmap & Hardware Deprecation Schedule',
      'product_lifecycle_roadmap.md',
      `# Product Lifecycle Roadmap & Sunset Schedules
Publication: Corporate Product Management

## 1. Legacy Gateway 400 Phase-Out
The 'Legacy Gateway 400' product line entered end-of-sale (EOS) phase on December 31, 2025.
- Sales teams are prohibited from quoting this unit for new installations starting January 2026.
- Existing customers are offered a 25% trade-in credit toward the Quantum Edge Gateway.
- As an expected consequence, sales volume for Legacy Gateway 400 dropped by more than 50% in 2026.

## 2. Quantum Sensor Pro Transition
The 'Quantum Sensor Pro' IoT unit is currently being superseded by the 'VisionAI Optical Sensor'. Marketing campaigns for the older Pro sensor ceased in Q4 2025, with manufacturing yields reduced to fulfill warranty replacements only. Revenue from this SKU is projected to decline at ~40% annualized run rate.`,
      'Product Management'
    );
  }
}

export const documentStore = new DocumentStore();

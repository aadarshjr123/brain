/**
 * Shapes of the compiled graph. These types are what the app and the engine import;
 * they carry no runtime code, so importing them never pulls Zod or YAML into a bundle.
 */
export type DomainId = string;
export type NodeId = string;

export interface Domain {
  id: DomainId;
  name: string;
  description: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface ConceptNode {
  id: NodeId;
  label: string;
  domain: DomainId;
  summary: string;
  aliases: string[];
  sources: Source[];
  /** ISO date (YYYY-MM-DD) the facts were last checked against the sources. */
  verified: string;
}

/** A directed relation, read as a sentence: `from` <relation> `to`. */
export interface Edge {
  from: NodeId;
  to: NodeId;
  relation: string;
  /** 1 = mechanical (default), 2 = close, 3 = loose. Routes prefer low weights once weighted routing lands. */
  weight: 1 | 2 | 3;
}

export interface ContentGraph {
  domains: Domain[];
  nodes: ConceptNode[];
  edges: Edge[];
}

import {
  siApachecassandra,
  siApachekafka,
  siCaddy,
  siClickhouse,
  siCockroachlabs,
  siElasticsearch,
  siGrafana,
  siJaeger,
  siMariadb,
  siMeilisearch,
  siMinio,
  siMongodb,
  siMysql,
  siNatsdotio,
  siNginx,
  siOpensearch,
  siPostgresql,
  siPrometheus,
  siRabbitmq,
  siRedis,
  siTraefikproxy,
  type SimpleIcon,
} from "simple-icons";

export const CATEGORIES = [
  "database",
  "cache",
  "queue",
  "search",
  "storage",
  "proxy",
  "observability",
  "service",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type KnownApp = {
  name: string;
  category: Category;
  /** Image repositories, matched against the whole repo path or its trailing segments. */
  aliases: string[];
  logo?: SimpleIcon;
};

export const CATALOGUE: Record<string, KnownApp> = {
  postgres: { name: "PostgreSQL", category: "database", aliases: ["postgres", "postgresql", "postgis"], logo: siPostgresql },
  mysql: { name: "MySQL", category: "database", aliases: ["mysql", "mysql-server"], logo: siMysql },
  mariadb: { name: "MariaDB", category: "database", aliases: ["mariadb"], logo: siMariadb },
  mongodb: { name: "MongoDB", category: "database", aliases: ["mongo", "mongodb", "mongodb-community-server"], logo: siMongodb },
  cockroachdb: { name: "CockroachDB", category: "database", aliases: ["cockroach", "cockroachdb"], logo: siCockroachlabs },
  clickhouse: { name: "ClickHouse", category: "database", aliases: ["clickhouse", "clickhouse-server"], logo: siClickhouse },
  cassandra: { name: "Cassandra", category: "database", aliases: ["cassandra"], logo: siApachecassandra },
  redis: { name: "Redis", category: "cache", aliases: ["redis", "redis-stack", "redis-stack-server"], logo: siRedis },
  valkey: { name: "Valkey", category: "cache", aliases: ["valkey"] },
  memcached: { name: "Memcached", category: "cache", aliases: ["memcached"] },
  rabbitmq: { name: "RabbitMQ", category: "queue", aliases: ["rabbitmq"], logo: siRabbitmq },
  kafka: { name: "Kafka", category: "queue", aliases: ["kafka", "cp-kafka"], logo: siApachekafka },
  nats: { name: "NATS", category: "queue", aliases: ["nats"], logo: siNatsdotio },
  elasticsearch: { name: "Elasticsearch", category: "search", aliases: ["elasticsearch"], logo: siElasticsearch },
  opensearch: { name: "OpenSearch", category: "search", aliases: ["opensearch"], logo: siOpensearch },
  meilisearch: { name: "Meilisearch", category: "search", aliases: ["meilisearch"], logo: siMeilisearch },
  typesense: { name: "Typesense", category: "search", aliases: ["typesense"] },
  minio: { name: "MinIO", category: "storage", aliases: ["minio"], logo: siMinio },
  nginx: { name: "NGINX", category: "proxy", aliases: ["nginx", "nginx-unprivileged"], logo: siNginx },
  traefik: { name: "Traefik", category: "proxy", aliases: ["traefik"], logo: siTraefikproxy },
  caddy: { name: "Caddy", category: "proxy", aliases: ["caddy"], logo: siCaddy },
  haproxy: { name: "HAProxy", category: "proxy", aliases: ["haproxy"] },
  grafana: { name: "Grafana", category: "observability", aliases: ["grafana"], logo: siGrafana },
  prometheus: { name: "Prometheus", category: "observability", aliases: ["prometheus"], logo: siPrometheus },
  jaeger: { name: "Jaeger", category: "observability", aliases: ["jaeger", "jaegertracing/all-in-one"], logo: siJaeger },
};

/** Catalogue key for an image like `docker.io/bitnami/postgresql:16-alpine`, if it is a Known App. */
export function recognise(image: string): string | undefined {
  const repo = image
    .split("@")[0]
    .replace(/:[^/]*$/, "")
    .toLowerCase();
  for (const [key, app] of Object.entries(CATALOGUE)) {
    if (app.aliases.some((a) => repo === a || repo.endsWith(`/${a}`))) return key;
  }
}

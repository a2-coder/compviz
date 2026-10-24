import {
  siAngular,
  siApache,
  siApachecassandra,
  siApachekafka,
  siApollographql,
  siBun,
  siCaddy,
  siClickhouse,
  siCockroachlabs,
  siDeno,
  siDjango,
  siDotnet,
  siElasticsearch,
  siExpress,
  siFastapi,
  siFlask,
  siGo,
  siGrafana,
  siGraphql,
  siHasura,
  siHtml5,
  siJaeger,
  siLaravel,
  siMariadb,
  siMeilisearch,
  siMinio,
  siMongodb,
  siMysql,
  siNatsdotio,
  siNestjs,
  siNextdotjs,
  siNginx,
  siNodedotjs,
  siNuxt,
  siOpenjdk,
  siOpensearch,
  siPhp,
  siPostgresql,
  siPrometheus,
  siPython,
  siRabbitmq,
  siReact,
  siRedis,
  siRuby,
  siRubyonrails,
  siRust,
  siSpring,
  siSvelte,
  siTraefikproxy,
  siVuedotjs,
  siWordpress,
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
  /** A Simple Icons entry, or any `{ path, hex }`: one SVG path in a 24×24 viewBox and a hex colour without `#`. */
  logo?: Pick<SimpleIcon, "path" | "hex">;
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
  httpd: { name: "Apache HTTP Server", category: "proxy", aliases: ["httpd", "apache"], logo: siApache },
  html: { name: "HTML", category: "service", aliases: ["html", "html5"], logo: siHtml5 },
  react: { name: "React", category: "service", aliases: ["react"], logo: siReact },
  nextjs: { name: "Next.js", category: "service", aliases: ["nextjs", "next"], logo: siNextdotjs },
  vue: { name: "Vue", category: "service", aliases: ["vue", "vuejs"], logo: siVuedotjs },
  nuxt: { name: "Nuxt", category: "service", aliases: ["nuxt"], logo: siNuxt },
  angular: { name: "Angular", category: "service", aliases: ["angular"], logo: siAngular },
  svelte: { name: "Svelte", category: "service", aliases: ["svelte", "sveltekit"], logo: siSvelte },
  nodejs: { name: "Node.js", category: "service", aliases: ["node", "nodejs"], logo: siNodedotjs },
  bun: { name: "Bun", category: "service", aliases: ["bun", "oven/bun"], logo: siBun },
  deno: { name: "Deno", category: "service", aliases: ["deno", "denoland/deno"], logo: siDeno },
  express: { name: "Express", category: "service", aliases: ["express"], logo: siExpress },
  nestjs: { name: "NestJS", category: "service", aliases: ["nestjs"], logo: siNestjs },
  python: { name: "Python", category: "service", aliases: ["python", "pypy"], logo: siPython },
  django: { name: "Django", category: "service", aliases: ["django"], logo: siDjango },
  flask: { name: "Flask", category: "service", aliases: ["flask"], logo: siFlask },
  fastapi: { name: "FastAPI", category: "service", aliases: ["fastapi"], logo: siFastapi },
  golang: { name: "Go", category: "service", aliases: ["golang", "go"], logo: siGo },
  rust: { name: "Rust", category: "service", aliases: ["rust"], logo: siRust },
  java: { name: "Java", category: "service", aliases: ["openjdk", "eclipse-temurin", "amazoncorretto", "java"], logo: siOpenjdk },
  spring: { name: "Spring", category: "service", aliases: ["spring", "spring-boot"], logo: siSpring },
  dotnet: { name: ".NET", category: "service", aliases: ["dotnet/aspnet", "dotnet/runtime", "dotnet/sdk", "dotnet"], logo: siDotnet },
  ruby: { name: "Ruby", category: "service", aliases: ["ruby"], logo: siRuby },
  rails: { name: "Rails", category: "service", aliases: ["rails"], logo: siRubyonrails },
  php: { name: "PHP", category: "service", aliases: ["php"], logo: siPhp },
  laravel: { name: "Laravel", category: "service", aliases: ["laravel"], logo: siLaravel },
  wordpress: { name: "WordPress", category: "service", aliases: ["wordpress"], logo: siWordpress },
  graphql: { name: "GraphQL", category: "service", aliases: ["graphql"], logo: siGraphql },
  apollo: { name: "Apollo", category: "service", aliases: ["apollo-router", "apollo"], logo: siApollographql },
  hasura: { name: "Hasura", category: "service", aliases: ["graphql-engine", "hasura"], logo: siHasura },
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

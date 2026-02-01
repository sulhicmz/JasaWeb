import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # ============================================
  # SCALAR TYPES
  # ============================================
  scalar DateTime
  scalar Decimal
  scalar JSON

  # ============================================
  # ENUMS
  # ============================================
  enum Role {
    admin
    client
  }

  enum ProjectType {
    sekolah
    berita
    company
  }

  enum ProjectStatus {
    pending_payment
    in_progress
    review
    completed
  }

  enum InvoiceStatus {
    unpaid
    paid
    pending
    failed
    cancelled
    expired
    refunded
    partial_refunded
  }

  enum PostStatus {
    draft
    published
  }

  enum PricingColor {
    primary
    success
    warning
  }

  # ============================================
  # TYPES
  # ============================================
  type User {
    id: ID!
    email: String!
    name: String!
    phone: String
    role: Role!
    createdAt: DateTime!
    projects(
      where: ProjectWhereInput
      orderBy: ProjectOrderByInput
      limit: Int
      offset: Int
    ): [Project!]!
    projectsCount(
      where: ProjectWhereInput
    ): Int!
    invoices(
      where: InvoiceWhereInput
      orderBy: InvoiceOrderByInput
      limit: Int
      offset: Int
    ): [Invoice!]!
    invoicesCount(
      where: InvoiceWhereInput
    ): Int!
    websocketConnections(
      where: WebSocketConnectionWhereInput
    ): [WebSocketConnection!]!
    realTimeNotifications(
      where: RealTimeNotificationWhereInput
    ): [RealTimeNotification!]!
  }

  type Project {
    id: ID!
    userId: ID!
    name: String!
    type: ProjectType!
    status: ProjectStatus!
    url: String
    credentials: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    invoices(
      where: InvoiceWhereInput
      orderBy: InvoiceOrderByInput
      limit: Int
      offset: Int
    ): [Invoice!]!
    invoicesCount: Int!
    webSocketConnections(
      where: WebSocketConnectionWhereInput
    ): [WebSocketConnection!]!
    realTimeNotifications(
      where: RealTimeNotificationWhereInput
    ): [RealTimeNotification!]!
  }

  type Invoice {
    id: ID!
    projectId: ID!
    amount: Decimal!
    status: InvoiceStatus!
    midtransOrderId: String
    qrisUrl: String
    paidAt: DateTime
    createdAt: DateTime!
    project: Project!
  }

  type Template {
    id: ID!
    name: String!
    category: ProjectType!
    imageUrl: String!
    demoUrl: String!
    createdAt: DateTime!
  }

  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String!
    featuredImage: String
    status: PostStatus!
    publishedAt: DateTime
    createdAt: DateTime!
  }

  type Page {
    id: ID!
    title: String!
    slug: String!
    content: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PricingPlan {
    id: ID!
    identifier: String!
    name: String!
    price: Decimal!
    description: String!
    features: JSON!
    popular: Boolean!
    color: PricingColor!
    sortOrder: Int!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WebSocketConnection {
    id: ID!
    userId: ID!
    connectionId: String!
    role: Role!
    ipAddress: String
    userAgent: String
    connectedAt: DateTime!
    lastActivity: DateTime!
    isAlive: Boolean!
    rooms: [String!]!
  }

  type RealTimeNotification {
    id: ID!
    userId: ID!
    type: String!
    title: String!
    message: String!
    priority: String!
    data: JSON!
    createdAt: DateTime!
    deliveredAt: DateTime
    isDelivered: Boolean!
  }

  # ============================================
  # INPUT TYPES
  # ============================================
  input UserWhereInput {
    id: IDFilterInput
    email: StringFilterInput
    name: StringFilterInput
    role: RoleFilterInput
    createdAt: DateTimeFilterInput
    AND: [UserWhereInput!]
    OR: [UserWhereInput!]
    NOT: UserWhereInput
  }

  input UserOrderByInput {
    id: SortOrder
    email: SortOrder
    name: SortOrder
    role: SortOrder
    createdAt: SortOrder
  }

  input ProjectWhereInput {
    id: IDFilterInput
    userId: IDFilterInput
    name: StringFilterInput
    type: ProjectTypeFilterInput
    status: ProjectStatusFilterInput
    createdAt: DateTimeFilterInput
    updatedAt: DateTimeFilterInput
    AND: [ProjectWhereInput!]
    OR: [ProjectWhereInput!]
    NOT: ProjectWhereInput
  }

  input ProjectOrderByInput {
    id: SortOrder
    userId: SortOrder
    name: SortOrder
    type: SortOrder
    status: SortOrder
    createdAt: SortOrder
    updatedAt: SortOrder
  }

  input InvoiceWhereInput {
    id: IDFilterInput
    projectId: IDFilterInput
    amount: DecimalFilterInput
    status: InvoiceStatusFilterInput
    midtransOrderId: StringFilterInput
    qrisUrl: StringFilterInput
    paidAt: DateTimeFilterInput
    createdAt: DateTimeFilterInput
    AND: [InvoiceWhereInput!]
    OR: [InvoiceWhereInput!]
    NOT: InvoiceWhereInput
  }

  input InvoiceOrderByInput {
    id: SortOrder
    projectId: SortOrder
    amount: SortOrder
    status: SortOrder
    midtransOrderId: SortOrder
    qrisUrl: SortOrder
    paidAt: SortOrder
    createdAt: SortOrder
  }

  input PostWhereInput {
    id: IDFilterInput
    title: StringFilterInput
    slug: StringFilterInput
    content: StringFilterInput
    featuredImage: StringFilterInput
    status: PostStatusFilterInput
    publishedAt: DateTimeFilterInput
    createdAt: DateTimeFilterInput
    AND: [PostWhereInput!]
    OR: [PostWhereInput!]
    NOT: PostWhereInput
  }

  input PostOrderByInput {
    id: SortOrder
    title: SortOrder
    slug: SortOrder
    content: SortOrder
    featuredImage: SortOrder
    status: SortOrder
    publishedAt: SortOrder
    createdAt: SortOrder
  }

  input PageWhereInput {
    id: IDFilterInput
    title: StringFilterInput
    slug: StringFilterInput
    content: StringFilterInput
    createdAt: DateTimeFilterInput
    updatedAt: DateTimeFilterInput
    AND: [PageWhereInput!]
    OR: [PageWhereInput!]
    NOT: PageWhereInput
  }

  input PageOrderByInput {
    id: SortOrder
    title: SortOrder
    slug: SortOrder
    content: SortOrder
    createdAt: SortOrder
    updatedAt: SortOrder
  }

  input TemplateWhereInput {
    id: IDFilterInput
    name: StringFilterInput
    category: ProjectTypeFilterInput
    imageUrl: StringFilterInput
    demoUrl: StringFilterInput
    createdAt: DateTimeFilterInput
    AND: [TemplateWhereInput!]
    OR: [TemplateWhereInput!]
    NOT: TemplateWhereInput
  }

  input TemplateOrderByInput {
    id: SortOrder
    name: SortOrder
    category: SortOrder
    imageUrl: SortOrder
    demoUrl: SortOrder
    createdAt: SortOrder
  }

  input PricingPlanWhereInput {
    id: IDFilterInput
    identifier: StringFilterInput
    name: StringFilterInput
    price: DecimalFilterInput
    popular: BooleanFilterInput
    color: PricingColorFilterInput
    isActive: BooleanFilterInput
    sortOrder: IntFilterInput
    createdAt: DateTimeFilterInput
    updatedAt: DateTimeFilterInput
    AND: [PricingPlanWhereInput!]
    OR: [PricingPlanWhereInput!]
    NOT: PricingPlanWhereInput
  }

  input PricingPlanOrderByInput {
    id: SortOrder
    identifier: SortOrder
    name: SortOrder
    price: SortOrder
    popular: SortOrder
    color: SortOrder
    sortOrder: SortOrder
    isActive: SortOrder
    createdAt: SortOrder
    updatedAt: SortOrder
  }

  input WebSocketConnectionWhereInput {
    id: IDFilterInput
    userId: IDFilterInput
    connectionId: StringFilterInput
    role: RoleFilterInput
    ipAddress: StringFilterInput
    userAgent: StringFilterInput
    connectedAt: DateTimeFilterInput
    lastActivity: DateTimeFilterInput
    isAlive: BooleanFilterInput
    AND: [WebSocketConnectionWhereInput!]
    OR: [WebSocketConnectionWhereInput!]
    NOT: WebSocketConnectionWhereInput
  }

  input RealTimeNotificationWhereInput {
    id: IDFilterInput
    userId: IDFilterInput
    type: StringFilterInput
    title: StringFilterInput
    message: StringFilterInput
    priority: StringFilterInput
    createdAt: DateTimeFilterInput
    deliveredAt: DateTimeFilterInput
    isDelivered: BooleanFilterInput
    AND: [RealTimeNotificationWhereInput!]
    OR: [RealTimeNotificationWhereInput!]
    NOT: RealTimeNotificationWhereInput
  }

  # Filter inputs
  input IDFilterInput {
    equals: ID
    in: [ID!]
    notIn: [ID!]
  }

  input StringFilterInput {
    equals: String
    in: [String!]
    notIn: [String!]
    contains: String
    startsWith: String
    endsWith: String
    not: String
  }

  input BooleanFilterInput {
    equals: Boolean
  }

  input IntFilterInput {
    equals: Int
    in: [Int!]
    notIn: [Int!]
    lt: Int
    lte: Int
    gt: Int
    gte: Int
  }

  input DecimalFilterInput {
    equals: Decimal
    lt: Decimal
    lte: Decimal
    gt: Decimal
    gte: Decimal
  }

  input DateTimeFilterInput {
    equals: DateTime
    in: [DateTime!]
    notIn: [DateTime!]
    lt: DateTime
    lte: DateTime
    gt: DateTime
    gte: DateTime
  }

  enum SortOrder {
    asc
    desc
  }

  # ============================================
  # MUTATIONS
  # ============================================
  type Mutation {
    # User mutations
    createUser(
      email: String!
      name: String!
      phone: String
      password: String!
      role: Role
    ): User!

    updateUser(
      id: ID!
      email: String
      name: String
      phone: String
      password: String
      role: Role
    ): User!

    deleteUser(id: ID!): Boolean!

    # Project mutations
    createProject(
      userId: ID!
      name: String!
      type: ProjectType!
      url: String
      credentials: JSON
    ): Project!

    updateProject(
      id: ID!
      userId: ID
      name: String
      type: ProjectType
      status: ProjectStatus
      url: String
      credentials: JSON
    ): Project!

    deleteProject(id: ID!): Boolean!

    # Invoice mutations
    createInvoice(
      projectId: ID!
      amount: Decimal!
    ): Invoice!

    updateInvoice(
      id: ID!
      status: InvoiceStatus
      midtransOrderId: String
      qrisUrl: String
      paidAt: DateTime
    ): Invoice!

    deleteInvoice(id: ID!): Boolean!

    # Post mutations
    createPost(
      title: String!
      slug: String!
      content: String!
      featuredImage: String
      status: PostStatus
      publishedAt: DateTime
    ): Post!

    updatePost(
      id: ID!
      title: String
      slug: String
      content: String
      featuredImage: String
      status: PostStatus
      publishedAt: DateTime
    ): Post!

    deletePost(id: ID!): Boolean!

    # Page mutations
    createPage(
      title: String!
      slug: String!
      content: String!
    ): Page!

    updatePage(
      id: ID!
      title: String
      slug: String
      content: String
    ): Page!

    deletePage(id: ID!): Boolean!

    # Template mutations
    createTemplate(
      name: String!
      category: ProjectType!
      imageUrl: String!
      demoUrl: String!
    ): Template!

    updateTemplate(
      id: ID!
      name: String
      category: ProjectType
      imageUrl: String
      demoUrl: String
    ): Template!

    deleteTemplate(id: ID!): Boolean!

    # PricingPlan mutations
    createPricingPlan(
      identifier: String!
      name: String!
      price: Decimal!
      description: String!
      features: JSON!
      popular: Boolean
      color: PricingColor
      sortOrder: Int
    ): PricingPlan!

    updatePricingPlan(
      id: ID!
      identifier: String
      name: String
      price: Decimal
      description: String
      features: JSON!
      popular: Boolean
      color: PricingColor
      sortOrder: Int
      isActive: Boolean
    ): PricingPlan!

    deletePricingPlan(id: ID!): Boolean!

    # WebSocket Connection mutations
    createWebSocketConnection(
      userId: ID!
      connectionId: String!
      role: Role!
      ipAddress: String
      userAgent: String
    ): WebSocketConnection!

    deleteWebSocketConnection(id: ID!): Boolean!

    # RealTime Notification mutations
    createRealTimeNotification(
      userId: ID!
      type: String!
      title: String!
      message: String!
      priority: String!
      data: JSON
    ): RealTimeNotification!

    markNotificationAsDelivered(id: ID!): RealTimeNotification!
  }

  # ============================================
  # QUERIES
  # ============================================
  type Query {
    # User queries
    user(id: ID!): User
    users(
      where: UserWhereInput
      orderBy: UserOrderByInput
      limit: Int
      offset: Int
    ): [User!]!
    usersCount(where: UserWhereInput): Int!

    # Project queries
    project(id: ID!): Project
    projects(
      where: ProjectWhereInput
      orderBy: ProjectOrderByInput
      limit: Int
      offset: Int
    ): [Project!]!
    projectsCount(where: ProjectWhereInput): Int!

    # Invoice queries
    invoice(id: ID!): Invoice
    invoices(
      where: InvoiceWhereInput
      orderBy: InvoiceOrderByInput
      limit: Int
      offset: Int
    ): [Invoice!]!
    invoicesCount(where: InvoiceWhereInput): Int!

    # Template queries
    template(id: ID!): Template
    templates(
      where: TemplateWhereInput
      orderBy: TemplateOrderByInput
      limit: Int
      offset: Int
    ): [Template!]!
    templatesCount(where: TemplateWhereInput): Int!

    # Post queries
    post(id: ID!): Post
    posts(
      where: PostWhereInput
      orderBy: PostOrderByInput
      limit: Int
      offset: Int
    ): [Post!]!
    postsCount(where: PostWhereInput): Int!

    # Page queries
    page(id: ID!): Page
    pages(
      where: PageWhereInput
      orderBy: PageOrderByInput
      limit: Int
      offset: Int
    ): [Page!]!
    pagesCount(where: PageWhereInput): Int!

    # PricingPlan queries
    pricingPlan(id: ID!): PricingPlan
    pricingPlans(
      where: PricingPlanWhereInput
      orderBy: PricingPlanOrderByInput
      limit: Int
      offset: Int
    ): [PricingPlan!]!
    pricingPlansCount(where: PricingPlanWhereInput): Int!

    # WebSocket Connection queries
    webSocketConnection(id: ID!): WebSocketConnection
    webSocketConnections(
      where: WebSocketConnectionWhereInput
      limit: Int
      offset: Int
    ): [WebSocketConnection!]!
    webSocketConnectionsCount: Int!

    # RealTime Notification queries
    realTimeNotification(id: ID!): RealTimeNotification
    realTimeNotifications(
      where: RealTimeNotificationWhereInput
      limit: Int
      offset: Int
    ): [RealTimeNotification!]!
    realTimeNotificationsCount: Int!

    # Stats queries
    stats: Stats!
  }

  # ============================================
  # SUBSCRIPTIONS
  # ============================================
  type Subscription {
    # User subscriptions
    userUpdated: User!
    projectCreated: Project!
    projectUpdated: Project!

    # Invoice subscriptions
    invoiceCreated: Invoice!
    invoiceUpdated: Invoice!
    invoicePaid: Invoice!

    # Post subscriptions
    postCreated: Post!
    postUpdated: Post!
    postPublished: Post!

    # Real-time notifications
    notificationCreated: RealTimeNotification!
    notificationDelivered: RealTimeNotification!

    # WebSocket subscriptions
    connectionCreated: WebSocketConnection!
    connectionClosed: WebSocketConnection!
  }

  # ============================================
  # RESPONSE TYPES
  # ============================================
  type Stats {
    users: Int!
    projects: Int!
    invoices: Int!
    posts: Int!
    pages: Int!
    templates: Int!
    pricingPlans: Int!
    webSocketConnections: Int!
    realTimeNotifications: Int!
  }
`;
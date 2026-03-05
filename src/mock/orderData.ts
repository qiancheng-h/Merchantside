// Mock data for Order Management Module
// Covers all 3 order types and all 5 statuses

export type OrderStatus = 'PENDING_CONFIRM' | 'PENDING_USE' | 'PENDING_MODIFY' | 'COMPLETED' | 'CANCELLED' | 'CLOSED'
export type OrderType = 'hotel' | 'medical' | 'booking'

export interface SmsRecord {
    id: string
    smsType: 'CONFIRM' | 'REJECT' | 'MODIFY_CONFIRM'
    smsTypeLabel: string
    receiverPhoneMasked: string
    smsContent: string
    sendStatus: 'UNSENT' | 'SENT' | 'FAILED'
    sendTime: string
    failReason?: string
}

export interface FlowRecord {
    id: string
    time: string
    desc: string
    operator: string
}

export interface ModifyRequest {
    field: string
    before: string
    after: string
}

export interface OrderItem {
    key: string
    orderNo: string
    orderType: OrderType
    status: OrderStatus
    // Customer info (NOT masked - display as-is)
    userName: string
    userPhone: string
    userIdCard: string
    // Appointment person info (Medical Person)
    appointPersonNameMasked: string
    appointPersonIdCard: string
    appointPersonGender?: string
    appointPersonAge?: number
    appointPersonPhone?: string
    appointPersonAddress?: string
    appointPersonRelation?: string
    appointPersonDinnerCheckIn?: boolean
    appointPersonDinnerMedical?: boolean
    // Service info
    serviceName: string
    price: number
    // Hotel specific
    checkInDate?: string
    checkOutDate?: string
    breakfast?: string
    roomCount?: number
    medicalType?: string
    scheduleDate?: string
    medicalBranch?: string
    medicalProject?: string
    medicalRoomType?: string
    hasCompanion?: boolean
    platformOrderNo?: string
    syncStatus?: 'SUCCESS' | 'FAILED' | 'PENDING'
    syncFailReason?: string
    lastSyncTime?: string
    settlementPrice?: number
    companionInfo?: {
        participate?: boolean
        name: string
        idCard: string
        phone: string
        age: number
        gender: string
        relation: string
        maritalStatus: string
        address: string
        project?: string
        dinnerCheckIn?: boolean
        dinnerMedical?: boolean
        feePayer?: string
    }
    // Booking specific
    appointDate?: string
    appointTime?: string
    serviceLocation?: string
    // Common
    merchant: string
    createTime: string
    confirmTime?: string
    verifyTime?: string
    verifyOperator?: string
    cancelTime?: string
    closeTime?: string
    remark?: string
    isSupplementary: boolean
    importBatchNo?: string
    absenceStatus?: 'ABSENT' | 'PRESENT'
    // Snapshot of original order before modification recall
    originalSnapshot?: Partial<OrderItem>
    recallTime?: string
    // Request flags
    hasCancelRequest?: boolean
    hasModifyRequest?: boolean
    modifyRequests?: ModifyRequest[]
    // Records
    smsRecords: SmsRecord[]
    flowRecords: FlowRecord[]
}

// ─── Status map ───────────────────────────────────────────────────────────────
export const statusMap: Record<OrderStatus, { text: string; color: string }> = {
  PENDING_CONFIRM: { text: '待确认', color: 'orange' },
  PENDING_USE: { text: '待核销', color: 'blue' },
  PENDING_MODIFY: { text: '待修改', color: 'gold' },
  COMPLETED: { text: '已完成', color: 'green' },
  CANCELLED: { text: '已取消', color: 'default' },
  CLOSED: { text: '已关闭', color: 'default' },
}

// ─── Hotel Orders ─────────────────────────────────────────────────────────────
export const hotelOrders: OrderItem[] = [
    {
        key: 'h1',
        orderNo: 'ORD-H-2026021801',
        orderType: 'hotel',
        status: 'PENDING_CONFIRM',
        userName: '张三',
        userPhone: '138****8801',
        userIdCard: '330102********1201',
        appointPersonNameMasked: '张*',
        appointPersonIdCard: '110105199001011201',
        serviceName: '豪华大床房',
        price: 899,
        checkInDate: '2026-02-25',
        checkOutDate: '2026-02-27',
        breakfast: '含早',
        roomCount: 1,
        merchant: '国寿合作酒店（北京）',
        createTime: '2026-02-18 10:32:00',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-18 10:32:00', desc: '用户下单', operator: '用户' },
        ],
    },
    {
        key: 'h2',
        orderNo: 'ORD-H-2026021802',
        orderType: 'hotel',
        status: 'PENDING_USE',
        userName: '李明',
        userPhone: '139****2202',
        userIdCard: '110101********2202',
        appointPersonNameMasked: '李*',
        appointPersonIdCard: '110105199001012202',
        serviceName: '商务双床房',
        price: 688,
        checkInDate: '2026-02-20',
        checkOutDate: '2026-02-22',
        breakfast: '不含早',
        roomCount: 1,
        merchant: '国寿合作酒店（北京）',
        createTime: '2026-02-17 14:20:00',
        confirmTime: '2026-02-17 15:05:00',
        isSupplementary: false,
        hasModifyRequest: true,
        modifyRequests: [
            { field: '入住日期', before: '2026-02-20', after: '2026-02-22' },
            { field: '房型', before: '商务双床房', after: '豪华大床房' },
        ],
        smsRecords: [
            {
                id: 's1',
                smsType: 'CONFIRM',
                smsTypeLabel: '确认订单',
                receiverPhoneMasked: '139****2202',
                smsContent: '尊敬的李*，您预订的商务双床房已确认，入住日期：2026-02-20至2026-02-22。如有疑问请联系：国寿合作酒店（北京）010-12345678。客服电话：400-000-0000',
                sendStatus: 'SENT',
                sendTime: '2026-02-17 15:05:30',
            },
        ],
        flowRecords: [
            { id: 'f1', time: '2026-02-17 14:20:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-17 15:05:00', desc: '商家确认订单', operator: '商家账号' },
            { id: 'f3', time: '2026-02-18 09:00:00', desc: '用户发起修改请求（早餐：不含早→含早）', operator: '用户' },
        ],
    },
    {
        key: 'h3',
        orderNo: 'ORD-H-2026021803',
        orderType: 'hotel',
        status: 'COMPLETED',
        userName: '王芳',
        userPhone: '137****3303',
        userIdCard: '440301********3303',
        appointPersonNameMasked: '王*',
        appointPersonIdCard: '110105199001013303',
        serviceName: '亲子套房',
        price: 1280,
        checkInDate: '2026-02-15',
        checkOutDate: '2026-02-17',
        breakfast: '含早',
        roomCount: 2,
        merchant: '国寿合作酒店（北京）',
        createTime: '2026-02-10 09:00:00',
        confirmTime: '2026-02-10 09:30:00',
        verifyTime: '2026-02-15 14:00:00',
        verifyOperator: '前台操作员',
        isSupplementary: false,
        smsRecords: [
            {
                id: 's1',
                smsType: 'CONFIRM',
                smsTypeLabel: '确认订单',
                receiverPhoneMasked: '137****3303',
                smsContent: '尊敬的王*，您预订的亲子套房已确认，入住日期：2026-02-15至2026-02-17。如有疑问请联系：国寿合作酒店（北京）010-12345678。',
                sendStatus: 'SENT',
                sendTime: '2026-02-10 09:30:20',
            },
        ],
        flowRecords: [
            { id: 'f1', time: '2026-02-10 09:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-10 09:30:00', desc: '商家确认订单', operator: '商家账号' },
            { id: 'f3', time: '2026-02-15 14:00:00', desc: '商家核销完成', operator: '前台操作员' },
        ],
    },
    {
        key: 'h4',
        orderNo: 'ORD-H-2026021804',
        orderType: 'hotel',
        status: 'CANCELLED',
        userName: '赵丽',
        userPhone: '135****4404',
        userIdCard: '320102********4404',
        appointPersonNameMasked: '赵*',
        appointPersonIdCard: '110105199001014404',
        serviceName: '行政套房',
        price: 2580,
        checkInDate: '2026-02-22',
        checkOutDate: '2026-02-24',
        breakfast: '含早',
        roomCount: 1,
        merchant: '国寿合作酒店（北京）',
        createTime: '2026-02-16 11:00:00',
        cancelTime: '2026-02-16 11:45:00',
        isSupplementary: false,
        hasCancelRequest: true,
        smsRecords: [
            {
                id: 's1',
                smsType: 'REJECT',
                smsTypeLabel: '不支持预约',
                receiverPhoneMasked: '135****4404',
                smsContent: '尊敬的赵*，非常抱歉，您预订的行政套房暂不可接待，订单已取消。如有疑问请联系客服：400-000-0000',
                sendStatus: 'FAILED',
                sendTime: '2026-02-16 11:45:10',
                failReason: '号码不存在',
            },
        ],
        flowRecords: [
            { id: 'f1', time: '2026-02-16 11:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-16 11:45:00', desc: '商家不可接待，订单取消', operator: '商家账号' },
        ],
    },
    {
        key: 'h5',
        orderNo: 'ORD-H-2026021805',
        orderType: 'hotel',
        status: 'CLOSED',
        userName: '孙小明',
        userPhone: '136****5505',
        userIdCard: '510104********5505',
        appointPersonNameMasked: '孙*',
        appointPersonIdCard: '110105199001015505',
        serviceName: '豪华大床房',
        price: 899,
        checkInDate: '2026-02-28',
        checkOutDate: '2026-03-01',
        breakfast: '含早',
        roomCount: 1,
        merchant: '国寿合作酒店（北京）',
        createTime: '2026-02-15 08:00:00',
        closeTime: '2026-02-15 20:00:00',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-15 08:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-15 20:00:00', desc: '系统超时关闭（12小时未确认）', operator: '系统' },
        ],
    },
    {
        key: 'h6',
        orderNo: 'ORD-H-SUPP-001',
        orderType: 'hotel',
        status: 'COMPLETED',
        userName: '周婷',
        userPhone: '133****6606',
        userIdCard: '330106********6606',
        appointPersonNameMasked: '周*',
        appointPersonIdCard: '110105199001016606',
        serviceName: '商务双床房',
        price: 688,
        checkInDate: '2026-02-10',
        checkOutDate: '2026-02-12',
        breakfast: '不含早',
        roomCount: 1,
        merchant: '国寿合作酒店（北京）',
        createTime: '',
        confirmTime: '',
        verifyTime: '2026-02-18 10:00:00',
        verifyOperator: '前台操作员',
        isSupplementary: true,
        remark: '线下已完成入住，补录归档',
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-18 10:00:00', desc: '商家新增订单（线下已履约）', operator: '前台操作员' },
        ],
    },
]

// ─── Medical Orders ───────────────────────────────────────────────────────────
export const medicalOrders: OrderItem[] = [
    {
        key: 'm1',
        orderNo: 'ORD-M-2026021801',
        orderType: 'medical',
        status: 'CANCELLED',
        userName: '陈娟',
        userPhone: '138****1101',
        userIdCard: '110102********1101',
        appointPersonNameMasked: '陈*',
        appointPersonIdCard: '110105199001011101',
        appointPersonGender: '女',
        appointPersonAge: 28,
        appointPersonPhone: '13811111101',
        appointPersonAddress: '北京市朝阳区某某街道1号',
        appointPersonRelation: '本人',
        serviceName: '五星体检-通用-门诊体检',
        price: 1299,
        settlementPrice: 1100.00,
        medicalType: '门诊',
        scheduleDate: '2026-03-05',
        medicalBranch: '慈铭体检朝阳分院',
        medicalProject: '五星体检',
        syncStatus: 'FAILED',
        syncFailReason: '商户系统异常，未拿到回执',
        lastSyncTime: '2026-02-18 09:16:00',
        merchant: '国寿合作体检中心（北京）',
        createTime: '2026-02-18 09:15:00',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-18 09:15:00', desc: '用户下单', operator: '用户' },
        ],
    },
    {
        key: 'm2',
        orderNo: 'ORD-M-2026021802',
        orderType: 'medical',
        status: 'PENDING_USE',
        userName: '吴德',
        userPhone: '139****2202',
        userIdCard: '440302********2202',
        appointPersonNameMasked: '吴*',
        appointPersonIdCard: '110105199001012202',
        appointPersonGender: '男',
        appointPersonAge: 35,
        appointPersonPhone: '13911112202',
        appointPersonAddress: '北京市海淀区中关村某某路2号',
        appointPersonRelation: '本人',
        appointPersonDinnerCheckIn: true,
        appointPersonDinnerMedical: false,
        serviceName: '四星体检-通用-住宿体检',
        price: 2580,
        settlementPrice: 2200.00,
        medicalType: '住宿',
        scheduleDate: '2026-02-25',
        medicalBranch: '美年大健康黄龙分院',
        medicalProject: '四星体检',
        medicalRoomType: '大床房',
        syncStatus: 'SUCCESS',
        platformOrderNo: 'PT-20260216-9912',
        lastSyncTime: '2026-02-16 13:05:22',
        hasCompanion: true,
        companionInfo: {
            participate: true,
            name: '吴小德',
            idCard: '440302199501012203',
            phone: '13911112222',
            age: 30,
            gender: '男',
            relation: '子女',
            maritalStatus: '未婚',
            address: '北京市海淀区中关村某某路2号',
            project: '四星体检',
            dinnerCheckIn: true,
            dinnerMedical: false,
            feePayer: '客户本人'
        },
        merchant: '国寿合作体检中心（北京）',
        createTime: '2026-02-16 13:00:00',
        isSupplementary: false,
        hasModifyRequest: true,
        modifyRequests: [
            { field: '档期日期', before: '2026-02-25', after: '2026-03-05' },
            { field: '体检类型', before: '住宿', after: '门诊' },
        ],
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-16 13:00:00', desc: '用户下单', operator: '用户' },
        ],
    },
    {
        key: 'm3',
        orderNo: 'ORD-M-2026021803',
        orderType: 'medical',
        status: 'COMPLETED',
        userName: '郑娟',
        userPhone: '137****3303',
        userIdCard: '320103********3303',
        appointPersonNameMasked: '郑*',
        appointPersonIdCard: '110105199001013303',
        serviceName: '三星体检-通用-门诊体检',
        price: 399,
        medicalType: '门诊',
        scheduleDate: '2026-02-10',
        merchant: '国寿合作体检中心（北京）',
        createTime: '2026-02-05 10:00:00',
        verifyTime: '2026-02-10 09:00:00',
        verifyOperator: '前台操作员',
        absenceStatus: 'PRESENT',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-05 10:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f3', time: '2026-02-10 09:00:00', desc: '商家核销完成', operator: '前台操作员' },
        ],
    },
    {
        key: 'm4',
        orderNo: 'ORD-M-2026021804',
        orderType: 'medical',
        status: 'CANCELLED',
        userName: '冯娟',
        userPhone: '135****4404',
        userIdCard: '510105********4404',
        appointPersonNameMasked: '冯*',
        appointPersonIdCard: '110105199001014404',
        serviceName: '五星体检-通用-门诊体检',
        price: 1299,
        medicalType: '门诊',
        scheduleDate: '2026-02-20',
        merchant: '国寿合作体检中心（北京）',
        createTime: '2026-02-14 15:00:00',
        cancelTime: '2026-02-15 10:00:00',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-14 15:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-15 10:00:00', desc: '用户取消订单，系统自动取消', operator: '系统（用户触发）' },
        ],
    },
    {
        key: 'm5',
        orderNo: 'ORD-M-2026021805',
        orderType: 'medical',
        status: 'CANCELLED',
        userName: '蒋娟',
        userPhone: '136****5505',
        userIdCard: '330107********5505',
        appointPersonNameMasked: '蒋*',
        appointPersonIdCard: '110105199001015505',
        serviceName: '四星体检-通用-住宿体检',
        price: 2580,
        medicalType: '住宿',
        scheduleDate: '2026-03-10',
        merchant: '国寿合作体检中心（北京）',
        createTime: '2026-02-17 08:00:00',
        closeTime: '2026-02-17 20:00:00',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-17 08:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-17 20:00:00', desc: '系统超时取消（未支付）', operator: '系统' },
        ],
    },
    {
        key: 'm6',
        orderNo: 'ORD-M-2026021806',
        orderType: 'medical',
        status: 'COMPLETED',
        userName: '赵磊',
        userPhone: '133****6606',
        userIdCard: '440103********6606',
        appointPersonNameMasked: '赵*',
        appointPersonIdCard: '110105199001016606',
        appointPersonGender: '男',
        appointPersonAge: 42,
        appointPersonPhone: '13311116606',
        appointPersonAddress: '北京市朝阳区某某路6号',
        appointPersonRelation: '本人',
        serviceName: '五星体检-通用-门诊体检',
        price: 1299,
        settlementPrice: 1100.00,
        medicalType: '门诊',
        scheduleDate: '2026-02-15',
        medicalBranch: '慈铭体检朝阳分院',
        medicalProject: '五星体检',
        syncStatus: 'SUCCESS',
        platformOrderNo: 'PT-20260210-7789',
        lastSyncTime: '2026-02-10 08:32:10',
        merchant: '国寿合作体检中心（北京）',
        createTime: '2026-02-10 08:00:00',
        verifyTime: '2026-02-15 10:30:00',
        verifyOperator: '前台操作员',
        absenceStatus: 'ABSENT',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-10 08:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-15 10:30:00', desc: '商家核销（缺席）', operator: '前台操作员' },
        ],
    },
    {
        key: 'm7',
        orderNo: 'ORD-M-2026021807',
        orderType: 'medical',
        status: 'PENDING_MODIFY',
        userName: '林晓波',
        userPhone: '132****7707',
        userIdCard: '440104********7707',
        appointPersonNameMasked: '林*',
        appointPersonIdCard: '110105199001017707',
        appointPersonGender: '男',
        appointPersonAge: 38,
        appointPersonPhone: '13211117707',
        appointPersonAddress: '北京市西城区某某路7号',
        appointPersonRelation: '本人',
        serviceName: '五星体检-通用-住宿体检',
        price: 2580,
        settlementPrice: 2200.00,
        medicalType: '住宿',
        scheduleDate: '2026-03-15',
        medicalBranch: '美年大健康西城分院',
        medicalProject: '五星体检',
        medicalRoomType: '大床房',
        syncStatus: 'SUCCESS',
        platformOrderNo: 'PT-20260220-3344',
        lastSyncTime: '2026-02-20 10:12:00',
        merchant: '国寿合作体检中心（北京）',
        createTime: '2026-02-20 10:00:00',
        recallTime: '2026-02-22 14:30:00',
        isSupplementary: false,
        originalSnapshot: {
            scheduleDate: '2026-03-10',
            medicalType: '门诊',
            medicalBranch: '慈铭体检朝阳分院',
            medicalRoomType: undefined,
            appointPersonPhone: '13211117707',
            appointPersonAddress: '北京市西城区某某路7号',
        },
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-20 10:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-20 10:12:00', desc: '订单同步至体检平台', operator: '系统' },
            { id: 'f3', time: '2026-02-22 14:30:00', desc: '客户申请修改，订单从商家侧撤回，等待修改', operator: '平台运营' },
        ],
    },
]

// ─── Booking Orders ───────────────────────────────────────────────────────────
export const bookingOrders: OrderItem[] = [
    {
        key: 'b1',
        orderNo: 'ORD-B-2026021801',
        orderType: 'booking',
        status: 'PENDING_CONFIRM',
        userName: '沈娟',
        userPhone: '138****1101',
        userIdCard: '110103********1101',
        appointPersonNameMasked: '沈*',
        appointPersonIdCard: '110105199001011101',
        serviceName: '贵宾接送机服务',
        price: 500,
        appointDate: '2026-02-25',
        appointTime: '10:00-12:00',
        serviceLocation: 'T3航站楼',
        merchant: '国寿合作贵宾服务（北京）',
        createTime: '2026-02-18 11:00:00',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-18 11:00:00', desc: '用户下单', operator: '用户' },
        ],
    },
    {
        key: 'b2',
        orderNo: 'ORD-B-2026021802',
        orderType: 'booking',
        status: 'PENDING_USE',
        userName: '韩娟',
        userPhone: '139****2202',
        userIdCard: '440303********2202',
        appointPersonNameMasked: '韩*',
        appointPersonIdCard: '110105199001012202',
        serviceName: 'T3航站楼贵宾接送机',
        price: 500,
        appointDate: '2026-02-22',
        appointTime: '14:00-16:00',
        serviceLocation: 'T3航站楼贵宾厅',
        merchant: '国寿合作贵宾服务（北京）',
        createTime: '2026-02-17 16:00:00',
        confirmTime: '2026-02-17 16:30:00',
        isSupplementary: false,
        hasModifyRequest: true,
        modifyRequests: [
            { field: '预约日期', before: '2026-02-22', after: '2026-02-25' },
        ],
        smsRecords: [
            {
                id: 's1',
                smsType: 'CONFIRM',
                smsTypeLabel: '确认订单',
                receiverPhoneMasked: '139****2202',
                smsContent: '尊敬的韩*，您预订的T3航站楼贵宾接送机已确认，预约日期：2026-02-22 14:00-16:00，地点：T3航站楼贵宾厅。如有疑问请联系：010-11112222。',
                sendStatus: 'SENT',
                sendTime: '2026-02-17 16:30:20',
            },
        ],
        flowRecords: [
            { id: 'f1', time: '2026-02-17 16:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-17 16:30:00', desc: '商家确认订单', operator: '商家账号' },
        ],
    },
    {
        key: 'b3',
        orderNo: 'ORD-B-2026021803',
        orderType: 'booking',
        status: 'COMPLETED',
        userName: '杨娟',
        userPhone: '137****3303',
        userIdCard: '320104********3303',
        appointPersonNameMasked: '杨*',
        appointPersonIdCard: '110105199001013303',
        serviceName: '北贵宾区服务',
        price: 500,
        appointDate: '2026-02-12',
        appointTime: '09:00-11:00',
        serviceLocation: '北贵宾区',
        merchant: '国寿合作贵宾服务（北京）',
        createTime: '2026-02-10 10:00:00',
        confirmTime: '2026-02-10 10:20:00',
        verifyTime: '2026-02-12 09:05:00',
        verifyOperator: '前台操作员',
        isSupplementary: false,
        smsRecords: [
            {
                id: 's1',
                smsType: 'CONFIRM',
                smsTypeLabel: '确认订单',
                receiverPhoneMasked: '137****3303',
                smsContent: '尊敬的杨*，您预订的北贵宾区服务已确认，预约日期：2026-02-12 09:00-11:00。',
                sendStatus: 'SENT',
                sendTime: '2026-02-10 10:20:30',
            },
        ],
        flowRecords: [
            { id: 'f1', time: '2026-02-10 10:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-10 10:20:00', desc: '商家确认订单', operator: '商家账号' },
            { id: 'f3', time: '2026-02-12 09:05:00', desc: '商家核销完成', operator: '前台操作员' },
        ],
    },
    {
        key: 'b4',
        orderNo: 'ORD-B-2026021804',
        orderType: 'booking',
        status: 'CANCELLED',
        userName: '朱娟',
        userPhone: '135****4404',
        userIdCard: '510106********4404',
        appointPersonNameMasked: '朱*',
        appointPersonIdCard: '110105199001014404',
        serviceName: '国际贵宾厅送机服务',
        price: 500,
        appointDate: '2026-02-20',
        appointTime: '08:00-10:00',
        serviceLocation: 'T4航站楼',
        merchant: '国寿合作贵宾服务（北京）',
        createTime: '2026-02-15 09:00:00',
        cancelTime: '2026-02-15 10:30:00',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-15 09:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-15 10:30:00', desc: '用户取消订单，系统自动取消', operator: '系统（用户触发）' },
        ],
    },
    {
        key: 'b5',
        orderNo: 'ORD-B-2026021805',
        orderType: 'booking',
        status: 'CLOSED',
        userName: '秦娟',
        userPhone: '136****5505',
        userIdCard: '330108********5505',
        appointPersonNameMasked: '秦*',
        appointPersonIdCard: '110105199001015505',
        serviceName: '贵宾接送机服务',
        price: 500,
        appointDate: '2026-03-01',
        appointTime: '15:00-17:00',
        serviceLocation: 'T3航站楼',
        merchant: '国寿合作贵宾服务（北京）',
        createTime: '2026-02-16 07:00:00',
        closeTime: '2026-02-16 19:00:00',
        isSupplementary: false,
        smsRecords: [],
        flowRecords: [
            { id: 'f1', time: '2026-02-16 07:00:00', desc: '用户下单', operator: '用户' },
            { id: 'f2', time: '2026-02-16 19:00:00', desc: '系统超时关闭（12小时未确认）', operator: '系统' },
        ],
    },
]

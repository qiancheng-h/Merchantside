import { ref } from "vue";

export interface MerchantInfo {
  id: string; // 唯一ID
  name: string; // 商家名称
  category: string; // 类别: 礼品类、酒店类、预定类、体检类
  region: string; // 商家所属区域
  desc: string; // 商家介绍（富文本）
  status: "operating" | "suspended";

  // 新增基础信息
  address?: string; // 商家地址
  phone?: string; // 联系电话
  images?: string[]; // 商家图片

  // 资质文件
  businessLicense: string; // 营业执照
  serviceAgreement: string; // 服务供应保障协议
  specialLicense?: string; // 特殊行业许可证（可选）

  // 仅酒店类相关
  hotelFacilities?: {
    traffic?: {
      parking?: boolean;
      parkingType?: "free" | "paid";
      chargingStation?: boolean;
      chargingStationType?: "free" | "paid";
    };
    frontDesk?: {
      twentyFourHour?: boolean;
      luggageStorage?: boolean;
      concierge?: boolean;
    };
    dining?: {
      breakfast?: boolean;
      restaurant?: boolean;
    };
    entertainment?: {
      publicWifi?: boolean;
      roomWifi?: boolean;
      pool?: boolean;
      poolType?: "free" | "paid";
      gym?: boolean;
      gymType?: "free" | "paid";
    };
  };
}

const defaultList: MerchantInfo[] = [
  {
    id: "M001",
    name: "每年大健康",
    category: "体检类",
    region: "浙江省",
    desc: "<p>提供优质的健康体检服务。</p>",
    address: "浙江省杭州市xx区",
    phone: "400-123-4567",
    businessLicense:
      "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    serviceAgreement:
      "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    status: "operating",
  },
  {
    id: "M002",
    name: "国寿君澜大酒店",
    category: "酒店类",
    region: "浙江省",
    desc: "<p>高端星级酒店服务。</p>",
    address: "浙江省杭州市xx区",
    phone: "0571-88888888",
    businessLicense:
      "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    serviceAgreement:
      "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    status: "operating",
    hotelFacilities: {
      traffic: {
        parking: true,
        parkingType: "free",
        chargingStation: false,
      },
      frontDesk: {
        twentyFourHour: true,
        luggageStorage: true,
        concierge: true,
      },
      dining: {
        breakfast: true,
        restaurant: true,
      },
      entertainment: {
        publicWifi: true,
        roomWifi: true,
        pool: true,
        poolType: "free",
        gym: true,
        gymType: "free",
      },
    },
  },
  {
    id: "M003",
    name: "萧山国际机场",
    category: "预定类",
    region: "浙江省",
    desc: "<p>提供快速通道预约及接送服务。</p>",
    address: "浙江省杭州市萧山区",
    phone: "0571-96299",
    businessLicense:
      "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    serviceAgreement:
      "https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg",
    status: "operating",
  },
];

export const merchantList = ref<MerchantInfo[]>([...defaultList]);
// For MainLayout backward compatibility
export const merchantInfo = ref<MerchantInfo>({ ...defaultList[0] });

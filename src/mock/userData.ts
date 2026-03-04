import { ref } from 'vue';

export interface UserAccount {
  id: string;
  username: string;
  phone: string;
  email?: string;
  status: 'enabled' | 'disabled';
  remark?: string;
}

const mockUsers: UserAccount[] = [
  {
    id: 'u1',
    username: 'admin',
    phone: '13800138000',
    email: 'admin@vshare.com',
    status: 'enabled',
    remark: '超级管理员，拥有所有权限'
  },
  {
    id: 'u2',
    username: '张运营',
    phone: '13911112222',
    email: 'zhangyy@vshare.com',
    status: 'enabled',
    remark: '日常订单处理'
  },
  {
    id: 'u3',
    username: '李财务',
    phone: '13700001111',
    status: 'disabled',
    remark: '账号暂被停用'
  }
];

export const userList = ref<UserAccount[]>([...mockUsers]);

export interface ManagedCard {
  id: string
  name: string
  issuerName: string
  last4: string
  imageUrl?: string | null
  isActive: boolean
}

export const MOCK_MANAGED_CARDS: ManagedCard[] = [
  {
    id: 'managed-kb-wesh',
    name: 'KB My WE:SH',
    issuerName: 'KB국민카드',
    last4: '4321',
    imageUrl: null,
    isActive: true,
  },
  {
    id: 'managed-shinhan-deep-dream',
    name: '신한 Deep Dream',
    issuerName: '신한카드',
    last4: '8847',
    imageUrl: null,
    isActive: true,
  },
  {
    id: 'managed-hyundai-zero',
    name: '현대 Zero Edition',
    issuerName: '현대카드',
    last4: '2291',
    imageUrl: null,
    isActive: true,
  },
  {
    id: 'managed-kb-wesh-disabled',
    name: 'KB My WE:SH',
    issuerName: 'KB국민카드',
    last4: '4321',
    imageUrl: null,
    isActive: false,
  },
]

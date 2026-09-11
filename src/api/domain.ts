/** BE enum 과 1:1 대응. `newspin-be/.../domain/**` 참고. */

export type NewsSentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
export type EventType = 'PANDEMIC' | 'POLICY' | 'DISASTER' | 'ECONOMIC' | 'TECHNOLOGY' | 'GEOPOLITICAL'
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED'
export type TradeType = 'BUY' | 'SELL'
/** 투자 리포트 생성 상태(I-11). GENERATING/FAILED 는 AI 섹션이 비어있고, 클라이언트는 폴링해야 한다. */
export type ReportStatus = 'GENERATING' | 'READY' | 'FAILED'

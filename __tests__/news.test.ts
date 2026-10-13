import { describe, expect, it } from "vitest";

import { categorize, isRoundupTitle } from "@/lib/news/classify";
import { clean, parseFeedXml, type Article } from "@/lib/news/parse";
import {
  isCompleteSentence,
  splitSentences,
  stripEditorMarks,
  toCard,
  toSummarySentence,
} from "@/lib/news/summarize";

const article = (over: Partial<Article>): Article => ({
  title: "코스피 상승 마감",
  description: "",
  link: "https://example.com/a",
  source: "테스트",
  published: Date.UTC(2026, 9, 13, 1, 0, 0),
  ...over,
});

describe("완결 문장 추출", () => {
  it("마침표·물음표·느낌표로 끝나는 문장만 완결로 본다", () => {
    expect(isCompleteSentence("코스피가 상승했다.")).toBe(true);
    expect(isCompleteSentence("정말 오를까?")).toBe(true);
    expect(isCompleteSentence('"금리를 동결했다."')).toBe(true);
  });

  it("말줄임(..., …)으로 끝난 잘린 문장은 완결로 보지 않는다", () => {
    expect(isCompleteSentence("외국인 매도세가 이어지는 가운데...")).toBe(false);
    expect(isCompleteSentence("외국인 매도세가 이어지는 가운데…")).toBe(false);
    expect(isCompleteSentence("매도세가 이어지는 가운데…\"")).toBe(false);
  });

  it("문장을 분리하고 너무 짧은 조각은 버린다", () => {
    const s = splitSentences("코스피가 1% 상승했다. 짧다. 외국인이 순매수에 나섰다.");
    expect(s).toEqual(["코스피가 1% 상승했다.", "외국인이 순매수에 나섰다."]);
  });

  it("카드 요약은 완결 문장만 쓰고 잘린 문장은 제외한다", () => {
    const card = toCard(
      article({
        description:
          "(서울=연합뉴스) 홍길동 기자 = 코스피가 1% 상승해 3,000선을 회복했다. 외국인이 순매수에 나섰다. 거래대금도 크게 늘어난 가운데...",
      }),
      "시장",
      0
    );
    expect(card.summary).toBe("코스피가 1% 상승해 3,000선을 회복했다. 외국인이 순매수에 나섰다.");
    expect(card.summary).not.toMatch(/\.\.\.|…/);
    expect(card.summary).not.toContain("거래대금");
  });

  it("완결 문장이 없으면 말줄임 없이 편집 표시만 뗀 제목을 요약으로 쓴다", () => {
    const title = "[마켓] 코스피, 외국인 매도에 약세 출발 (종합)";
    const card = toCard(
      article({ title, description: "코스피가 장 초반 약세를 보이며 외국인 매도세가 이어지는 가운데 기관은 순매수에..." }),
      "시장",
      3
    );
    expect(card.headline).toBe("코스피, 외국인 매도에 약세 출발");
    expect(card.summary).toBe("코스피, 외국인 매도에 약세 출발");
    expect(card.id).toBe("rss-3");
    expect(card.publishedAt).toBe("2026-10-13 10:00");
  });
});

describe("비금융 기사 분류", () => {
  it("금융·경제와 무관한 기사는 null을 반환한다", () => {
    expect(categorize("프로야구 한국시리즈 1차전 개막")).toBeNull();
    expect(categorize("유명 배우 결혼 소식 전해져")).toBeNull();
  });

  it("카테고리를 우선순위에 맞게 분류한다", () => {
    expect(categorize("원/달러 환율 1,400원 돌파")).toBe("환율");
    expect(categorize("한국은행 기준금리 동결")).toBe("금리");
    expect(categorize("코스피 3,000선 회복")).toBe("시장");
    expect(categorize("상장사 영업이익 증가")).toBe("기업");
  });
});

describe("모음성 헤드라인 필터링", () => {
  it("이 시각 헤드라인·뉴스 모음류 제목을 걸러낸다", () => {
    expect(isRoundupTitle("[연합뉴스 이 시각 헤드라인]")).toBe(true);
    expect(isRoundupTitle("[오늘의 뉴스] 경제 브리핑")).toBe(true);
    expect(isRoundupTitle("주요뉴스 정리")).toBe(true);
  });

  it("일반 기사 제목은 통과시킨다", () => {
    expect(isRoundupTitle("[속보] 코스피 3,000선 회복")).toBe(false);
  });
});

describe("종결 보정 (기사에 없는 문구를 만들지 않음)", () => {
  it("서술형 종결이면 마침표만 붙이고 인용부호를 제거한다", () => {
    expect(toSummarySentence("한은이 금리를 동결했다")).toBe("한은이 금리를 동결했다.");
    expect(toSummarySentence("“한은, 금리 동결했다”")).toBe("한은, 금리 동결했다.");
  });

  it("화살표로 끝나는 제목은 상승·하락 문장으로 바꾼다", () => {
    expect(toSummarySentence("코스피 2%↑")).toBe("코스피 2% 상승했습니다.");
    expect(toSummarySentence("나스닥 1.5%▼")).toBe("나스닥 1.5% 하락했습니다.");
  });

  it("연결 어미·조사·명사형 조각은 문장으로 만들지 않고 원문 그대로 둔다", () => {
    expect(toSummarySentence("코스피가 상승세를 이어가고")).toBe("코스피가 상승세를 이어가고");
    expect(toSummarySentence("지수가 상승하며")).toBe("지수가 상승하며");
    expect(toSummarySentence("지수가 상승하면서")).toBe("지수가 상승하면서");
    expect(toSummarySentence("환율이 하락했지만")).toBe("환율이 하락했지만");
    expect(toSummarySentence("기준금리는")).toBe("기준금리는");
    expect(toSummarySentence("기준금리를")).toBe("기준금리를");
    expect(toSummarySentence("환율 변동성과")).toBe("환율 변동성과");
    expect(toSummarySentence("증시 급락에 따른 사고")).toBe("증시 급락에 따른 사고");
  });

  it("기사에 없는 문구(관련 소식입니다·분석됐습니다 등)를 생성하지 않는다", () => {
    const generated = [
      "있습니다",
      "분석됐습니다",
      "지켜볼 필요",
      "관련 소식",
      "대한 소식",
      "정리했습니다",
    ];
    const fragments = [
      "코스피가 상승세를 이어가고",
      "지수가 상승하며",
      "지수가 상승하면서",
      "환율이 하락했지만",
      "물가가 안정되나",
      "기준금리는",
      "기준금리를",
      "환율 변동성과",
      "한국은행의",
      "원/달러 환율 1,400원 돌파",
      "삼성전자 영업이익 증가",
    ];
    for (const f of fragments) {
      const out = toSummarySentence(f);
      expect(out).toBe(f);
      for (const g of generated) expect(out).not.toContain(g);

      // 카드 요약도 제목 조각 외의 문구를 만들지 않는다.
      const card = toCard(article({ title: f, description: "" }), "시장", 0);
      expect(card.summary).toBe(f);
    }
  });
});

describe("RSS 파싱·정제", () => {
  it("HTML 태그와 이중 인코딩된 엔티티를 정리한다", () => {
    expect(clean("&lt;p&gt;코스피 &amp;quot;상승&amp;quot;&lt;/p&gt;")).toBe('코스피 "상승"');
    expect(clean("가\u200b나   다")).toBe("가나 다");
  });

  it("편집 말머리·꼬리말 태그를 제거한다", () => {
    expect(stripEditorMarks("[마켓스토리] 코스피 상승 (종합)")).toBe("코스피 상승");
  });

  it("제목이 없거나 날짜가 잘못된 항목은 버린다", () => {
    const xml = `<rss><channel>
      <item><title>코스피 &quot;상승&quot;</title><description>&lt;p&gt;본문 &amp;amp; 내용&lt;/p&gt;</description><link>https://a.test/1</link><pubDate>Tue, 13 Oct 2026 01:00:00 GMT</pubDate></item>
      <item><title>날짜 없음</title></item>
      <item><description>제목 없음</description><pubDate>Tue, 13 Oct 2026 01:00:00 GMT</pubDate></item>
    </channel></rss>`;
    const items = parseFeedXml(xml, "테스트");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: '코스피 "상승"',
      description: "본문 & 내용",
      link: "https://a.test/1",
      source: "테스트",
      published: Date.UTC(2026, 9, 13, 1, 0, 0),
    });
  });

  it("항목이 하나뿐인 피드도 파싱한다", () => {
    const xml = `<rss><channel><item><title>환율 급등</title><pubDate>Tue, 13 Oct 2026 01:00:00 GMT</pubDate></item></channel></rss>`;
    expect(parseFeedXml(xml, "s")).toHaveLength(1);
    expect(parseFeedXml("<rss><channel></channel></rss>", "s")).toEqual([]);
  });
});

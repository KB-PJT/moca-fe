const CATEGORY_ID_KEY = 'map:selectedCategoryId'
const CATEGORY_PICKER_SEEN_KEY = 'map:categoryPickerSeen'

// 카테고리 선택 모달은 "카테고리를 고를 수 있다"는 걸 처음 한 번 알려주는 용도라, 한 번
// 보여준 뒤로는(선택 여부와 무관하게) 다시 자동으로 띄우지 않는다. 이후엔 화면 상단의
// 카테고리 버튼으로 언제든 수동으로 바꿀 수 있다.
export function useCategoryPreference() {
  function getSavedCategoryId(): string | null {
    return localStorage.getItem(CATEGORY_ID_KEY)
  }

  function hasSeenCategoryPicker(): boolean {
    return localStorage.getItem(CATEGORY_PICKER_SEEN_KEY) === '1'
  }

  function markCategoryPickerSeen(): void {
    localStorage.setItem(CATEGORY_PICKER_SEEN_KEY, '1')
  }

  function saveCategorySelection(categoryId: string): void {
    localStorage.setItem(CATEGORY_ID_KEY, categoryId)
    markCategoryPickerSeen()
  }

  return {
    getSavedCategoryId,
    hasSeenCategoryPicker,
    markCategoryPickerSeen,
    saveCategorySelection,
  }
}

# Hướng dẫn sử dụng Combobox chuẩn

Tài liệu này mô tả cách sử dụng component Combobox chuẩn trong dự án, dựa trên mẫu đã được triển khai trong ShipperBuyerSection.

## Giới thiệu

Combobox chuẩn (`HeadlessuiCombobox`) là một component tùy chỉnh dựa trên Headless UI, được thiết kế để xử lý các trường hợp phức tạp như tìm kiếm, tải thêm dữ liệu, và hiển thị dữ liệu có cấu trúc.

## Cách sử dụng

### 1. Import component

```tsx
import { Combobox as HeadlessuiCombobox } from "@/components/ui/combobox"
```

### 2. Chuẩn bị dữ liệu

Dữ liệu cần được chuyển đổi sang định dạng chuẩn trước khi truyền vào component:

```tsx
const items = data.map(item => ({
  label: item.name,
  description: item.email || '',
  value: item.id
}))
```

### 3. Sử dụng component

```tsx
<HeadlessuiCombobox
  items={items}
  value={selectedValue}
  onChange={handleChange}
  placeholder="Select an item..."
  onSearch={handleSearch}
  loading={isLoading}
  emptyContent={
    <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
      {isLoading ? "Loading..." : "No items found"}
    </div>
  }
  loadingContent={
    <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
      Loading...
    </div>
  }
  showSelected
  onLoadMore={handleLoadMore}
  hasMore={hasMoreItems}
  isLoadingMore={isLoadingMore}
  selectedItemData={
    selectedValue ? {
      value: selectedValue,
      label: items.find(item => item.value === selectedValue)?.label || '',
      description: items.find(item => item.value === selectedValue)?.description || ''
    } : null
  }
/>
```

### 4. Xử lý dữ liệu trong hook

Để đảm bảo không có ID trùng lặp, hãy sử dụng Map để loại bỏ trùng lặp:

```tsx
// Loại bỏ trùng lặp trước khi cập nhật danh sách
const uniqueItems = Array.from(
  new Map(items.map(item => [item.id, item])).values()
);
```

## Props

| Prop | Kiểu dữ liệu | Mô tả |
|------|--------------|-------|
| `items` | `ComboboxItem[]` | Danh sách các item hiển thị trong combobox |
| `value` | `string` | Giá trị hiện tại được chọn |
| `onChange` | `(value: string) => void` | Hàm xử lý khi giá trị thay đổi |
| `placeholder` | `string` | Placeholder hiển thị khi không có giá trị nào được chọn |
| `onSearch` | `(query: string) => void` | Hàm xử lý khi người dùng tìm kiếm |
| `loading` | `boolean` | Trạng thái loading ban đầu |
| `emptyContent` | `React.ReactNode` | Nội dung hiển thị khi không có kết quả |
| `loadingContent` | `React.ReactNode` | Nội dung hiển thị khi đang tải dữ liệu |
| `showSelected` | `boolean` | Hiển thị icon check bên cạnh item được chọn |
| `onLoadMore` | `() => void` | Hàm xử lý khi cần tải thêm dữ liệu |
| `hasMore` | `boolean` | Có thêm dữ liệu để tải hay không |
| `isLoadingMore` | `boolean` | Đang tải thêm dữ liệu hay không |
| `selectedItemData` | `ComboboxItem \| null` | Dữ liệu của item được chọn |

## Ví dụ

### Ví dụ 1: Combobox đơn giản

```tsx
<HeadlessuiCombobox
  items={clients.map(client => ({
    label: client.name,
    value: client.id
  }))}
  value={selectedClientId}
  onChange={handleClientChange}
  placeholder="Select a client..."
/>
```

### Ví dụ 2: Combobox với tìm kiếm và tải thêm

```tsx
<HeadlessuiCombobox
  items={clients.map(client => ({
    label: client.name,
    description: client.email || '',
    value: client.id
  }))}
  value={selectedClientId}
  onChange={handleClientChange}
  placeholder="Select a client..."
  onSearch={handleClientSearch}
  loading={isLoading}
  onLoadMore={loadMoreClients}
  hasMore={hasMoreClients}
  isLoadingMore={isLoadingMoreClients}
  selectedItemData={
    selectedClientId ? {
      value: selectedClientId,
      label: clients.find(c => c.id === selectedClientId)?.name || '',
      description: clients.find(c => c.id === selectedClientId)?.email || ''
    } : null
  }
/>
```

## Lưu ý

1. Luôn loại bỏ trùng lặp ID trước khi truyền dữ liệu vào component
2. Sử dụng `selectedItemData` để hiển thị thông tin chi tiết của item được chọn
3. Xử lý tìm kiếm và tải thêm dữ liệu trong hook, không xử lý trong component

/**
 * Script để chuẩn hóa tên hàng hóa dựa trên bảng đề xuất gộp
 * Sử dụng Supabase JavaScript client để thực hiện cập nhật
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Khởi tạo Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Đường dẫn đến file CSV chứa thông tin ánh xạ
const mappingFilePath = path.join(__dirname, 'commodity-mapping-suggestions.csv');

// Hàm đọc file CSV và trả về dữ liệu ánh xạ
async function readMappingFile() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(mappingFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Hàm cập nhật danh mục cho hàng hóa
async function updateCommodityCategory(commodityId, categoryId) {
  const { data, error } = await supabase
    .from('commodities_new')
    .update({ category_id: categoryId })
    .eq('id', commodityId);

  if (error) {
    console.error(`Lỗi khi cập nhật danh mục cho hàng hóa ${commodityId}:`, error);
    return false;
  }
  return true;
}

// Hàm lấy ID danh mục dựa trên tên danh mục
async function getCategoryIdByName(categoryName) {
  const { data, error } = await supabase
    .from('categories_new')
    .select('id')
    .eq('name', categoryName)
    .single();

  if (error) {
    console.error(`Lỗi khi lấy ID danh mục cho ${categoryName}:`, error);
    return null;
  }
  return data.id;
}

// Hàm lấy ID hàng hóa đã chuẩn hóa dựa trên tên
async function getStandardizedCommodityId(standardizedName) {
  const { data, error } = await supabase
    .from('commodities_new')
    .select('id')
    .eq('name', standardizedName)
    .not('category_id', 'is', null)
    .single();

  if (error) {
    console.error(`Lỗi khi lấy ID hàng hóa chuẩn hóa cho ${standardizedName}:`, error);
    return null;
  }
  return data.id;
}

// Hàm lấy danh sách hàng hóa chưa gán danh mục
async function getUncategorizedCommodities() {
  const { data, error } = await supabase
    .from('commodities_new')
    .select('id, name')
    .is('category_id', null)
    .order('name');

  if (error) {
    console.error('Lỗi khi lấy danh sách hàng hóa chưa gán danh mục:', error);
    return [];
  }
  return data;
}

// Hàm chính để thực hiện chuẩn hóa
async function standardizeCommodities() {
  try {
    // Đọc file ánh xạ
    const mappings = await readMappingFile();
    console.log(`Đã đọc ${mappings.length} ánh xạ từ file CSV`);

    // Tạo bảng ánh xạ từ tên chưa chuẩn hóa đến tên chuẩn hóa và danh mục
    const mappingTable = {};
    for (const mapping of mappings) {
      mappingTable[mapping['Tên hàng hóa chưa gán danh mục']] = {
        standardizedName: mapping['Tên hàng hóa đã chuẩn hóa'],
        categoryName: mapping['Danh mục']
      };
    }

    // Lấy danh sách hàng hóa chưa gán danh mục
    const uncategorizedCommodities = await getUncategorizedCommodities();
    console.log(`Tìm thấy ${uncategorizedCommodities.length} hàng hóa chưa gán danh mục`);

    // Thống kê
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Xử lý từng hàng hóa chưa gán danh mục
    for (const commodity of uncategorizedCommodities) {
      const mapping = mappingTable[commodity.name];
      
      if (!mapping) {
        console.log(`Không tìm thấy ánh xạ cho hàng hóa: ${commodity.name}`);
        skippedCount++;
        continue;
      }

      // Lấy ID danh mục dựa trên tên danh mục
      const categoryId = await getCategoryIdByName(mapping.categoryName);
      if (!categoryId) {
        console.error(`Không tìm thấy danh mục: ${mapping.categoryName}`);
        errorCount++;
        continue;
      }

      // Cập nhật danh mục cho hàng hóa
      const success = await updateCommodityCategory(commodity.id, categoryId);
      if (success) {
        updatedCount++;
        console.log(`Đã cập nhật danh mục cho hàng hóa: ${commodity.name} -> ${mapping.standardizedName} (${mapping.categoryName})`);
      } else {
        errorCount++;
      }
    }

    // Hiển thị kết quả
    console.log('\n===== KẾT QUẢ CHUẨN HÓA =====');
    console.log(`Tổng số hàng hóa chưa gán danh mục: ${uncategorizedCommodities.length}`);
    console.log(`Số hàng hóa đã cập nhật: ${updatedCount}`);
    console.log(`Số hàng hóa bỏ qua: ${skippedCount}`);
    console.log(`Số lỗi: ${errorCount}`);

  } catch (error) {
    console.error('Lỗi khi thực hiện chuẩn hóa:', error);
  }
}

// Thực thi hàm chính
standardizeCommodities().catch(console.error);

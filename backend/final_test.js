const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function finalTest() {
  try {
    console.log('🔧 最终测试：验证Content-Disposition修复');
    console.log('=' * 50);
    
    // 1. 登录
    console.log('1. 登录系统...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功');
    
    // 2. 创建包含问题字符的测试文件
    const problemFilenames = [
      '测试文件\n带换行符.txt',
      '文件名\r\n包含回车换行.doc',
      '包含\t制表符.pdf',
      '"引号文件".txt'
    ];
    
    for (let i = 0; i < problemFilenames.length; i++) {
      const filename = problemFilenames[i];
      console.log(`\n2.${i+1} 测试文件名: ${JSON.stringify(filename)}`);
      
      // 创建临时文件
      const tempPath = path.join(__dirname, `temp_${i}.txt`);
      fs.writeFileSync(tempPath, `测试内容 ${i}`);
      
      try {
        // 上传文件
        const formData = new FormData();
        formData.append('file', fs.createReadStream(tempPath), {
          filename: filename
        });
        formData.append('task_id', '1');
        
        const uploadResponse = await axios.post('http://localhost:3000/api/files/upload', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            ...formData.getHeaders()
          }
        });
        
        const fileId = uploadResponse.data.id;
        console.log(`   ✅ 上传成功，文件ID: ${fileId}`);
        
        // 测试下载
        const downloadResponse = await axios.get(`http://localhost:3000/api/files/download/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'stream'
        });
        
        const contentDisposition = downloadResponse.headers['content-disposition'];
        console.log(`   📄 Content-Disposition: ${contentDisposition}`);
        
        // 检查是否包含问题字符
        const hasNewline = contentDisposition.includes('\n') || contentDisposition.includes('\r');
        const hasTab = contentDisposition.includes('\t');
        
        if (hasNewline || hasTab) {
          console.log(`   ❌ 仍然包含问题字符！`);
        } else {
          console.log(`   ✅ Content-Disposition头部正常`);
        }
        
      } catch (error) {
        console.log(`   ❌ 测试失败: ${error.message}`);
      } finally {
        // 清理临时文件
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    }
    
    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应:', error.response.data);
    }
  }
}

finalTest();
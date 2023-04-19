function greeting() {
	// Ambil input nama dari user menggunakan dialog
	var name = prompt("Silakan masukkan nama Anda:", "");

	// Ambil waktu saat ini
	var today = new Date();
	var hour = today.getHours();

	// Set pesan sambutan sesuai waktu
	var greeting;
	if (hour < 10) {
		greeting = "Selamat pagi, ";
	} else if (hour < 15) {
		greeting = "Selamat siang, ";
	} else if (hour < 18) {
		greeting = "Selamat sore, ";
	} else {
		greeting = "Selamat malam, ";
	}

	// Tampilkan pesan sambutan dan nama pengunjung
	document.getElementById("greeting").innerHTML = greeting + name + "!";
	
	// Update jam setiap detik
	setInterval(showTime, 1000);

	document.getElementById("pesan").innerHTML = "Hari ini hatiku sedang baik, aku bahagia karena kamu masih di sisiku, " + name +". Aku berharap kehadiran dirimu tetap seperti matahari sampai kapan pun. Yang selalu memberikan harapan, sinar penerang, dan selalu menghangatkan hatiku."
}

// Mendapatkan waktu saat ini
var currentTime = new Date().getHours();

// Mendapatkan elemen background
var bgImage = document.getElementById("background-image");

function showTime() {
	// Ambil waktu saat ini
	var today = new Date();
	var hour = today.getHours();
	var minute = today.getMinutes();
	var second = today.getSeconds();

	// Tambahkan nol di depan angka jika kurang dari 10
	hour = addZero(hour);
	minute = addZero(minute);
	second = addZero(second);

	// Tampilkan waktu pada elemen h1 dengan id "clock"
	document.getElementById("clock").innerHTML = hour + ":" + minute + ":" + second;
}



function addZero(num) {
	if (num < 10) {
		num = "0" + num;
	}
	return num;
}

// Kondisi untuk menentukan gambar background
if (currentTime >= 0 && currentTime < 10) {
	bgImage.style.backgroundImage = "url('https://cdnwpseller.gramedia.net/wp-content/uploads/2022/02/15150327/image001-11.jpg')";
	} else if (currentTime >= 10 && currentTime < 15) {
	bgImage.style.backgroundImage = "url('https://thumb.viva.co.id/media/frontend/thumbs3/2017/05/30/592d0b586873f-ilustrasi-matahari_665_374.jpg')";
	} else if (currentTime >= 15 && currentTime < 18) {
	bgImage.style.backgroundImage = "url('https://storage.nu.or.id/storage/post/16_9/big/7_1659578325.webp')";
	} else {
	bgImage.style.backgroundImage = "url('https://asset.kompas.com/crops/CMl2hwLOzrAC5tZnxnF4c1IWclM=/12x123:1000x782/750x500/data/photo/2020/04/14/5e951a7103ff2.jpg')";
	}
